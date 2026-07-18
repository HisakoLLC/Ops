import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';
import { AOE_EVENTS } from '@/lib/inngest/events';

const COMMON_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'zoho.com',
  'protonmail.com',
  'mail.com',
  'yandex.com',
  'live.com',
  'msn.com',
  'gmx.com',
  'mail.ru',
]);

function getDomainFromEmail(email: string | null | undefined, companyName: string): string {
  if (email && email.includes('@')) {
    const parts = email.split('@');
    const domain = parts[parts.length - 1].trim().toLowerCase();
    if (domain && !COMMON_EMAIL_DOMAINS.has(domain)) {
      return `https://${domain}`;
    }
  }
  
  // Fallback domain based on company name
  const cleanName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
    
  return `https://${cleanName || 'placeholder'}.com`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Validate session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
    }

    const { leadId } = body;
    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId parameter' }, { status: 400 });
    }

    // Fetch CRM Lead details
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json(
        { error: `CRM Lead not found: ${fetchError?.message || 'Unknown error'}` },
        { status: 404 }
      );
    }

    // Extract domain name
    const companyUrl = getDomainFromEmail(lead.contact_email, lead.company_name);

    // Construct pipeline payload
    const payload = {
      company_name: lead.company_name,
      company_url: companyUrl,
      contact_email: lead.contact_email || null,
      contact_name: lead.contact_name || null,
      contact_title: null, // Title not explicitly tracked in core leads schema
      status: 'PENDING' as const,
    };

    // Upsert prospect into pipeline table
    const { data: pipelineLead, error: insertError } = await supabase
      .from('aoe_pipeline_leads')
      .upsert(payload, { onConflict: 'company_url' })
      .select('id, status')
      .single();

    if (insertError || !pipelineLead) {
      return NextResponse.json(
        { error: `Failed to insert lead into AOE pipeline: ${insertError?.message}` },
        { status: 500 }
      );
    }

    // Trigger pipeline if lead status is PENDING (i.e. not previously processed/skipped)
    if (pipelineLead.status === 'PENDING') {
      await inngest.send(AOE_EVENTS.LEAD_INGESTED.create({ lead_id: pipelineLead.id }));
    }

    return NextResponse.json({
      success: true,
      message: `Lead successfully queued in the AOE pipeline`,
      pipelineLeadId: pipelineLead.id,
      companyUrl,
    });

  } catch (error: any) {
    console.error('[Scan Lead POST Error]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
