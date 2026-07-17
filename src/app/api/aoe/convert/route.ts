import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id } = await req.json()
  if (!lead_id) return NextResponse.json({ error: 'Missing lead_id' }, { status: 400 })

  const { data: lead } = await supabase
    .from('aoe_leads')
    .select('*')
    .eq('id', lead_id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.converted_to_client_id) {
    return NextResponse.json({ error: 'Already converted', client_id: lead.converted_to_client_id }, { status: 409 })
  }

  // Generate a random 4-character suffix for unique client ref
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ref = `CL-${suffix}`;

  // ── Create client record ──────────────────────────────────────────────────
  const { data: newClient, error: clientError } = await supabase
    .from('clients')
    .insert({
      ref:             ref,
      company_name:    lead.company_name,
      contact_name:    lead.contact_name,
      contact_email:   lead.contact_email,
      website:         lead.company_url,
      pipeline_stage:  'discovery',  // AOE converts go straight to discovery
      source:          'AOE Outbound',
      notes: [
        `Converted from AOE lead.`,
        `Strategic hook: ${lead.strategic_hook}`,
        `Primary pain point: ${lead.primary_pain_point}`,
        `Qualification confidence: ${lead.qualification_confidence}`,
        `Qualification reason: ${lead.qualification_reason}`,
      ].join('\n\n'),
      created_by: user.id,
      tags: ['aoe', 'outbound'],
    })
    .select()
    .single()

  if (clientError) {
    return NextResponse.json({ error: clientError.message }, { status: 500 })
  }

  // ── Update AOE lead ───────────────────────────────────────────────────────
  await supabase.from('aoe_leads').update({
    status: 'CONVERTED',
    converted_to_client_id: newClient.id,
    reviewed_by: user.id,
  }).eq('id', lead_id)

  // ── Log activity on new client ────────────────────────────────────────────
  await supabase.from('activities').insert({
    client_id:  newClient.id,
    created_by: user.id,
    type:       'note',
    title:      'Converted from AOE outbound lead',
    body:       `AOE Lead ID: ${lead.aoe_lead_id}\nEmails sent: ${[lead.sent_at_1, lead.sent_at_2, lead.sent_at_3].filter(Boolean).length}/3`,
    metadata:   { aoe_lead_id: lead.id, source: 'AOE' },
  })

  return NextResponse.json({ success: true, client_id: newClient.id })
}
