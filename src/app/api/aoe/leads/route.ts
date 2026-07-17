import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const secret = process.env.OPS_API_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Validate required fields ──────────────────────────────────────────────
  const required = ['contact', 'intelligence', 'qualification', 'sequence', 'aoe_meta']
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 })
    }
  }

  const { contact, intelligence, qualification, sequence, aoe_meta, ingested_at, drafted_at } = body

  // ── Check if email already a client ───────────────────────────────────────
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existingClient } = await serviceClient
    .from('clients')
    .select('id, company_name')
    .eq('contact_email', contact.email)
    .maybeSingle()

  // ── Upsert (handle duplicate aoe_lead_id gracefully) ─────────────────────
  const { data: inserted, error } = await serviceClient
    .from('aoe_leads')
    .upsert({
      aoe_lead_id:              aoe_meta.lead_id,
      aoe_draft_id:             aoe_meta.draft_id,
      source:                   body.source || 'AOE',
      contact_name:             contact.name,
      contact_title:            contact.title,
      contact_email:            contact.email,
      company_name:             contact.company_name,
      company_url:              contact.company_url,
      value_proposition:        intelligence.value_proposition,
      target_audience:          intelligence.target_audience,
      scaling_signals:          intelligence.scaling_signals,
      strategic_hook:           intelligence.strategic_hook,
      primary_pain_point:       intelligence.primary_pain_point,
      qualification_confidence: qualification.confidence,
      qualification_reason:     qualification.reason,
      tier_1_passed:            qualification.tier_1_passed,
      tier_2_passed:            qualification.tier_2_passed,
      email_1_subject_a:        sequence.email_1.subject_a,
      email_1_subject_b:        sequence.email_1.subject_b,
      email_1_body:             sequence.email_1.body,
      email_2_subject_a:        sequence.email_2.subject_a,
      email_2_subject_b:        sequence.email_2.subject_b,
      email_2_body:             sequence.email_2.body,
      email_3_subject_a:        sequence.email_3.subject_a,
      email_3_subject_b:        sequence.email_3.subject_b,
      email_3_body:             sequence.email_3.body,
      // Default selections to subject_a
      selected_subject_1:       sequence.email_1.subject_a,
      selected_subject_2:       sequence.email_2.subject_a,
      selected_subject_3:       sequence.email_3.subject_a,
      ingested_at:              ingested_at || new Date().toISOString(),
      drafted_at:               drafted_at || new Date().toISOString(),
      // Flag if already a client
      status:                   existingClient ? 'ARCHIVED' : 'PENDING_REVIEW',
      notes:                    existingClient
        ? `Auto-archived: contact email matches existing client "${existingClient.company_name}"`
        : null,
    }, {
      onConflict: 'aoe_lead_id',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) {
    console.error('AOE ingest error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { success: true, id: inserted.id, already_client: !!existingClient },
    { status: 201 }
  )
}
