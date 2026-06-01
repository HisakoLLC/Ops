import { createClient } from '@/lib/supabase/server'
import { resend } from '@/lib/email/resend'
import {
  documentEmail, followUpEmail, onboardingEmail, invoiceEmail
} from '@/lib/email/templates'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    type,           // 'document' | 'followup' | 'onboarding' | 'invoice'
    to,             // recipient email
    clientId,
    documentId,     // if type === 'document'
    templateData,   // extra data for the template
  } = await req.json()

  // Fetch sender profile
  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()
  const senderName = profile?.full_name || 'The Hisako Team'

  let subject = ''
  let html = ''
  let attachments: any[] = []

  if (type === 'document' && documentId) {
    // Fetch document record
    const { data: doc } = await supabase
      .from('documents').select('*, clients(*)').eq('id', documentId).single()
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const client = doc.clients as any
    const docLabels: Record<string, string> = {
      proposal: 'Automation Proposal',
      nda: 'Non-Disclosure Agreement',
      services_agreement: 'Client Services Agreement',
      pipeline_handover: 'Pipeline Handover Document',
      monthly_report: 'Monthly Pipeline Report',
    }
    const docLabel = docLabels[doc.doc_type] || doc.doc_label

    subject = `${docLabel} — Hisako Technologies`
    html = documentEmail({
      clientName: client.contact_name || client.company_name,
      docType: doc.doc_type,
      docLabel,
      message: templateData?.message,
      senderName,
    })

    // Fetch file from Supabase Storage and attach
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const isClientFacing = ['proposal', 'nda', 'services_agreement', 'monthly_report'].includes(doc.doc_type)
    const needsSigning = ['nda', 'services_agreement'].includes(doc.doc_type)

    if (isClientFacing) {
      const pdfStoragePath = doc.storage_path.replace(/\.docx$/, '.pdf')
      
      // Download PDF
      const { data: pdfFileData } = await serviceClient.storage
        .from('hisako-documents')
        .download(pdfStoragePath)

      if (pdfFileData) {
        const pdfBuffer = Buffer.from(await pdfFileData.arrayBuffer())
        attachments.push({
          filename: `${docLabel.replace(/\s+/g, '-')}_Hisako.pdf`,
          content: pdfBuffer,
        })
      }

      // Download DOCX if it needs signing
      if (needsSigning) {
        const { data: docxFileData } = await serviceClient.storage
          .from('hisako-documents')
          .download(doc.storage_path)

        if (docxFileData) {
          const docxBuffer = Buffer.from(await docxFileData.arrayBuffer())
          attachments.push({
            filename: `${docLabel.replace(/\s+/g, '-')}_editable_version.docx`,
            content: docxBuffer,
          })
        }
      }

      // Fallback to DOCX if PDF download failed
      if (attachments.length === 0) {
        const { data: docxFileData } = await serviceClient.storage
          .from('hisako-documents')
          .download(doc.storage_path)

        if (docxFileData) {
          const docxBuffer = Buffer.from(await docxFileData.arrayBuffer())
          attachments.push({
            filename: `${docLabel.replace(/\s+/g, '-')}_Hisako.docx`,
            content: docxBuffer,
          })
        }
      }
    } else {
      // Non-client facing, or default: just attach DOCX
      const { data: docxFileData } = await serviceClient.storage
        .from('hisako-documents')
        .download(doc.storage_path)

      if (docxFileData) {
        const docxBuffer = Buffer.from(await docxFileData.arrayBuffer())
        attachments = [{
          filename: `${docLabel.replace(/\s+/g, '-')}_Hisako.docx`,
          content: docxBuffer,
        }]
      }
    }

    // Log activity on client
    await supabase.from('activities').insert({
      client_id: doc.client_id,
      created_by: user.id,
      type: 'email',
      title: `Document emailed: ${docLabel}`,
      metadata: { document_id: documentId, recipient: to },
    })

  } else if (type === 'followup') {
    subject = 'Following up — Hisako Proposal'
    html = followUpEmail({ ...templateData, senderName })

  } else if (type === 'onboarding') {
    subject = `Engagement Started — ${templateData.projectName}`
    html = onboardingEmail({ ...templateData, senderName })

  } else if (type === 'invoice') {
    subject = templateData.isReminder ? `Reminder: Invoice ${templateData.invoiceRef} — Hisako Technologies` : `Invoice ${templateData.invoiceRef} — Hisako Technologies`
    html = invoiceEmail({ ...templateData, senderName })

    // Generate invoice PDF on the fly
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, clients(company_name, contact_name, contact_email)')
      .eq('id', documentId)
      .single()

    if (invoice) {
      // Fetch settings for payment link
      const { data: settings } = await supabase.from('settings').select('*').limit(1).single()

      const mergedData = {
        invoice_ref: invoice.invoice_ref,
        client_name: invoice.clients?.company_name || "[Client Name]",
        issued_date: invoice.issued_date,
        due_date: invoice.due_date,
        status: invoice.status,
        amount: invoice.amount,
        line_items: invoice.line_items || [],
        payment_link: settings?.payment_link || "[ADD YOUR PAYMENT DETAILS]",
        settings: settings || {},
      }

      const { buildDocument } = await import('@/lib/documents')
      const { Packer } = await import('docx')
      const doc = buildDocument("invoice", mergedData)
      const docxBuffer = await Packer.toBuffer(doc)

      // Convert to PDF via Gotenberg
      try {
        const formData = new FormData()
        formData.append("files", new Blob([new Uint8Array(docxBuffer)]), "invoice.docx")

        const pdfResponse = await fetch("https://demo.gotenberg.dev/forms/libreoffice/convert", {
          method: "POST",
          body: formData,
        })

        if (pdfResponse.ok) {
          const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())
          attachments.push({
            filename: `${invoice.invoice_ref || 'invoice'}_Hisako.pdf`,
            content: pdfBuffer,
          })
        } else {
          // Fallback to docx
          attachments.push({
            filename: `${invoice.invoice_ref || 'invoice'}_Hisako.docx`,
            content: docxBuffer,
          })
        }
      } catch (e) {
        // Fallback to docx
        attachments.push({
          filename: `${invoice.invoice_ref || 'invoice'}_Hisako.docx`,
          content: docxBuffer,
        })
      }

      // Log invoice sent
      await supabase.from('activities').insert({
        client_id: invoice.client_id,
        created_by: user.id,
        type: 'email',
        title: `Invoice emailed: ${invoice.invoice_ref}`,
        metadata: { invoice_id: documentId, recipient: to },
      })
    }
  }

  try {
    const result = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: [to],
      replyTo: 'hello@hisako.eu',
      subject,
      html,
      attachments,
    })
    return NextResponse.json({ success: true, id: result.data?.id })
  } catch (e: any) {
    console.error('Resend error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
