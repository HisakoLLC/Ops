import { createClient } from '@supabase/supabase-js';
import { inngest } from '@/lib/inngest/client';
import { AOE_EVENTS } from '@/lib/inngest/events';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export interface RawLeadInput {
  company_name?: string;
  company_url?: string;
  contact_email?: string;
  contact_name?: string;
  contact_title?: string;
  [key: string]: any;
}

export interface IngestSummary {
  received: number;
  inserted: number;
  duplicates_skipped: number;
}

/**
 * Shared lead ingestion processing logic used by both the Webhook endpoint and CSV import script.
 */
export async function processLeads(leads: RawLeadInput[]): Promise<IngestSummary> {
  const supabase = getSupabase();
  const summary: IngestSummary = {
    received: leads.length,
    inserted: 0,
    duplicates_skipped: 0,
  };

  for (const lead of leads) {
    const company_name = lead.company_name?.trim();
    const company_url = lead.company_url?.trim();

    if (!company_name || !company_url) {
      console.warn(`[Ingest] Skipping lead missing company_name or company_url:`, lead);

      await supabase.from('error_logs').insert({
        worker: 'INGEST',
        error_message: 'Missing required fields (company_name or company_url)',
        error_payload: { raw_lead: lead },
        resolved: false,
      });
      continue;
    }

    const payload = {
      company_name,
      company_url,
      contact_email: lead.contact_email?.trim() || null,
      contact_name: lead.contact_name?.trim() || null,
      contact_title: lead.contact_title?.trim() || null,
      status: 'PENDING' as const,
    };

    const { data, error } = await supabase
      .from('aoe_pipeline_leads')
      .upsert(payload, { onConflict: 'company_url', ignoreDuplicates: true })
      .select('id');

    if (error) {
      throw new Error(`Supabase upsert error for ${company_url}: ${error.message} (Code: ${error.code})`);
    }

    if (data && data.length > 0) {
      const newLeadId = data[0].id;
      summary.inserted++;

      await inngest.send(AOE_EVENTS.LEAD_INGESTED.create({ lead_id: newLeadId }));
    } else {
      summary.duplicates_skipped++;
    }
  }

  return summary;
}
