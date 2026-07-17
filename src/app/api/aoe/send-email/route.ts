import { createClient } from '@/lib/supabase/server'
import { resend } from '@/lib/email/resend'  // reuse existing client
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, email_step, to_email, to_name, subject, body } = await req.json()

  if (!lead_id || ![1,2,3].includes(email_step) || !to_email || !subject || !body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // ── Validate lead exists and step is sendable ─────────────────────────────
  const { data: lead } = await supabase
    .from('aoe_leads')
    .select('id, status, sent_at_1, sent_at_2, sent_at_3, contact_email')
    .eq('id', lead_id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  // Gate: email_2 requires email_1 sent; email_3 requires email_2 sent
  if (email_step === 2 && !lead.sent_at_1) {
    return NextResponse.json({ error: 'Email 1 must be sent before Email 2' }, { status: 400 })
  }
  if (email_step === 3 && !lead.sent_at_2) {
    return NextResponse.json({ error: 'Email 2 must be sent before Email 3' }, { status: 400 })
  }
  if (lead.status === 'REJECTED' || lead.status === 'ARCHIVED') {
    return NextResponse.json({ error: 'Cannot send to rejected or archived lead' }, { status: 400 })
  }

  // ── Send via Resend ───────────────────────────────────────────────────────
  let sendResult
  try {
    sendResult = await resend.emails.send({
      from: `${process.env.RESEND_FROM_AOE_NAME || 'Mohamed | Zetafo'} <${process.env.RESEND_FROM_AOE_EMAIL || 'outreach@updates.zetafo.com'}>`,
      to: [to_email],
      subject,
      text: body,
      // Plain text only for cold outreach — avoids spam filters
    })
  } catch (e: any) {
    return NextResponse.json({ error: `Resend error: ${e.message}` }, { status: 500 })
  }

  if (sendResult.error) {
    return NextResponse.json({ error: sendResult.error.message }, { status: 500 })
  }

  // ── Update lead record ────────────────────────────────────────────────────
  const now = new Date().toISOString()
  const updateData: Record<string, any> = {
    [`sent_at_${email_step}`]: now,
    status: `EMAIL_${email_step}_SENT`,
    reviewed_by: user.id,
    // Save which body was actually sent
    [`edited_body_${email_step}`]: body,
  }

  await supabase.from('aoe_leads').update(updateData).eq('id', lead_id)

  return NextResponse.json({ success: true, resend_id: sendResult.data?.id })
}
