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
    const { data: fileData } = await serviceClient.storage
      .from('hisako-documents')
      .download(doc.storage_path)

    if (fileData) {
      const buffer = Buffer.from(await fileData.arrayBuffer())
      attachments = [{
        filename: `${docLabel.replace(/\s+/g, '-')}_Hisako.docx`,
        content: buffer,
      }]
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
    subject = `Invoice ${templateData.invoiceRef} — Hisako Technologies`
    html = invoiceEmail({ ...templateData, senderName })
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
