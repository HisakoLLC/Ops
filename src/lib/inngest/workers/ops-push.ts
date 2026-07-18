import { inngest } from '../client';
import { AOE_EVENTS } from '../events';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export const opsPushWorker = inngest.createFunction(
  {
    id: 'aoe-ops-push-worker',
    name: 'AOE Ops Push Worker',
    retries: 3,
    triggers: [{ event: AOE_EVENTS.LEAD_DRAFTED }],
  },
  async ({ event, step }) => {
    const { lead_id, draft_id } = event.data;
    const supabase = getSupabase();

    // STEP 1: fetch-complete-lead
    const fetched = await step.run('fetch-complete-lead', async () => {
      try {
        const { data: lead, error: leadError } = await supabase
          .from('aoe_pipeline_leads')
          .select('*')
          .eq('id', lead_id)
          .single();

        if (leadError || !lead) {
          throw new Error(`Lead ${lead_id} not found: ${leadError?.message || 'Unknown error'}`);
        }

        if (lead.status !== 'DRAFTED') {
          console.log(`[Ops Push Worker] Lead ${lead_id} is not DRAFTED (Status: ${lead.status}). Returning early.`);
          return null;
        }

        const { data: draft, error: draftError } = await supabase
          .from('outbound_drafts')
          .select('*')
          .eq('id', draft_id)
          .single();

        if (draftError || !draft) {
          throw new Error(`Draft ${draft_id} not found: ${draftError?.message || 'Unknown error'}`);
        }

        const { data: qualificationLogs, error: qualError } = await supabase
          .from('qualification_logs')
          .select('*')
          .eq('lead_id', lead_id);

        if (qualError) {
          throw new Error(`Failed to fetch qualification_logs for ${lead_id}: ${qualError.message}`);
        }

        return { lead, draft, qualificationLogs: qualificationLogs || [] };
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'OPS_PUSH',
          error_message: `Step 1 (fetch-complete-lead) failed: ${err.message || String(err)}`,
          error_payload: { lead_id, draft_id, error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    if (!fetched) {
      return { status: 'skipped_or_not_found', lead_id, draft_id };
    }

    const { lead, draft, qualificationLogs } = fetched;

    // STEP 2: push-to-aoe-leads (direct DB write — same Supabase instance)
    await step.run('push-to-aoe-leads', async () => {
      try {
        const tier2Log = qualificationLogs.find((log: any) => log.tier === 2) || qualificationLogs[qualificationLogs.length - 1];
        const rawLlm = (tier2Log?.llm_raw_response || {}) as { confidence?: string; reason?: string };
        const enrichmentData = (lead.enrichment_data || {}) as {
          value_proposition?: string;
          target_audience?: string;
          scaling_signals?: string;
        };

        // Check if contact is already a client
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id, company_name')
          .eq('contact_email', lead.contact_email)
          .maybeSingle();

        const { error: upsertError } = await supabase
          .from('aoe_leads')
          .upsert({
            aoe_lead_id:              lead.id,
            aoe_draft_id:             draft.id,
            source:                   'AOE',
            contact_name:             lead.contact_name,
            contact_title:            lead.contact_title,
            contact_email:            lead.contact_email,
            company_name:             lead.company_name,
            company_url:              lead.company_url,
            value_proposition:        enrichmentData.value_proposition,
            target_audience:          enrichmentData.target_audience,
            scaling_signals:          enrichmentData.scaling_signals,
            strategic_hook:           lead.strategic_hook,
            primary_pain_point:       lead.primary_pain_point,
            qualification_confidence: rawLlm.confidence,
            qualification_reason:     rawLlm.reason || tier2Log?.reason,
            tier_1_passed:            true,
            tier_2_passed:            true,
            email_1_subject_a:        draft.email_1_subject_a,
            email_1_subject_b:        draft.email_1_subject_b,
            email_1_body:             draft.email_1_body,
            email_2_subject_a:        draft.email_2_subject_a,
            email_2_subject_b:        draft.email_2_subject_b,
            email_2_body:             draft.email_2_body,
            email_3_subject_a:        draft.email_3_subject_a,
            email_3_subject_b:        draft.email_3_subject_b,
            email_3_body:             draft.email_3_body,
            selected_subject_1:       draft.email_1_subject_a,
            selected_subject_2:       draft.email_2_subject_a,
            selected_subject_3:       draft.email_3_subject_a,
            ingested_at:              lead.created_at,
            drafted_at:               draft.created_at,
            status:                   existingClient ? 'ARCHIVED' : 'PENDING_REVIEW',
            notes:                    existingClient
              ? `Auto-archived: contact email matches existing client "${existingClient.company_name}"`
              : null,
          }, {
            onConflict: 'aoe_lead_id',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          throw new Error(`Failed to upsert aoe_leads: ${upsertError.message}`);
        }

        // Update pipeline tables
        await supabase
          .from('aoe_pipeline_leads')
          .update({ status: 'PUSHED_TO_OPS' })
          .eq('id', lead_id);

        await supabase
          .from('outbound_drafts')
          .update({ delivery_status: 'PUSHED' })
          .eq('id', draft_id);

        await inngest.send(AOE_EVENTS.LEAD_PUSHED_TO_OPS.create({ lead_id, draft_id }));
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'OPS_PUSH',
          error_message: `Step 2 (push-to-aoe-leads) failed: ${err.message || String(err)}`,
          error_payload: { lead_id, draft_id, error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    console.log(`[Ops Push Worker] Successfully pushed lead ${lead_id} to aoe_leads.`);
    return { status: 'success', lead_id, draft_id };
  }
);
