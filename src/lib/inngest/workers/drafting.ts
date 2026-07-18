import { inngest } from '../client';
import { AOE_EVENTS } from '../events';
import { createClient } from '@supabase/supabase-js';
import { generateJSON } from '@/lib/gemini/client';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

interface EmailDraft {
  subject_a: string;
  subject_b: string;
  body: string;
}

export const draftingWorker = inngest.createFunction(
  {
    id: 'aoe-drafting-worker',
    name: 'AOE Outreach Drafting Worker',
    retries: 3,
    triggers: [{ event: AOE_EVENTS.LEAD_QUALIFIED }],
  },
  async ({ event, step }) => {
    const { lead_id } = event.data;
    const supabase = getSupabase();

    // STEP 1: fetch-qualified-lead
    const fetched = await step.run('fetch-qualified-lead', async () => {
      try {
        const { data: lead, error: leadError } = await supabase
          .from('aoe_pipeline_leads')
          .select('*')
          .eq('id', lead_id)
          .single();

        if (leadError || !lead) {
          console.warn(`[Drafting Worker] Lead not found: ${lead_id}`);
          return null;
        }

        if (lead.status !== 'QUALIFIED') {
          console.log(`[Drafting Worker] Lead ${lead_id} is not QUALIFIED (Status: ${lead.status}). Returning early.`);
          return null;
        }

        const { data: icp, error: icpError } = await supabase
          .from('icp_config')
          .select('service_framework')
          .limit(1)
          .maybeSingle();

        if (icpError) {
          throw new Error(`Failed to fetch icp_config: ${icpError.message}`);
        }

        const { error: updateError } = await supabase
          .from('aoe_pipeline_leads')
          .update({ status: 'DRAFTING' })
          .eq('id', lead_id);

        if (updateError) {
          throw new Error(`Failed to transition status to DRAFTING: ${updateError.message}`);
        }

        return { lead, serviceFramework: icp?.service_framework || 'Standard B2B high-impact growth services.' };
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'DRAFTING',
          error_message: `Step 1 (fetch-qualified-lead) failed: ${err.message || String(err)}`,
          error_payload: { error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    if (!fetched) {
      return { status: 'skipped_or_not_found', lead_id };
    }

    const { lead, serviceFramework } = fetched;

    // STEP 2: generate-sequence
    const sequence = await step.run('generate-sequence', async () => {
      try {
        const prompt = `You are an elite B2B cold email copywriter.
You write direct, short, value-first outreach that does 
not sound like AI. No fluff. No buzzwords.

Service Framework:
${serviceFramework}

Rules:
- Email 1: 4-5 sentences max. Lead with the strategic 
  hook. End with one low-friction CTA (a question, 
  not a meeting request).
- Email 2: 2-3 sentences. Reference Email 1. Add one 
  piece of social proof or new context. Soft bump.
- Email 3: 2 sentences. Clean breakup. Leave the door open.
- Subject lines: Under 7 words. No clickbait. No emojis.
- Write in first person as the sender.
- Forbidden phrases: "I hope this finds you", 
  "touch base", "quick question", "synergy", 
  "leverage", "reach out", "circle back", 
  "hop on a call", "game-changer"

Lead Intelligence:
- Company: ${lead.company_name}
- Strategic Hook: ${lead.strategic_hook}
- Primary Pain Point: ${lead.primary_pain_point}
- Contact: ${lead.contact_name}, ${lead.contact_title}

Return ONLY a JSON object:
{
  "email_1": { "subject_a": string, "subject_b": string, "body": string },
  "email_2": { "subject_a": string, "subject_b": string, "body": string },
  "email_3": { "subject_a": string, "subject_b": string, "body": string }
}`;

        const draft = await generateJSON<{
          email_1: EmailDraft;
          email_2: EmailDraft;
          email_3: EmailDraft;
        }>(prompt);

        const emails: ('email_1' | 'email_2' | 'email_3')[] = ['email_1', 'email_2', 'email_3'];
        const fields: (keyof EmailDraft)[] = ['subject_a', 'subject_b', 'body'];

        for (const emailKey of emails) {
          const emailObj = draft[emailKey];
          if (!emailObj || typeof emailObj !== 'object') {
            throw new Error(`Missing or invalid email object: ${emailKey}`);
          }
          for (const fieldKey of fields) {
            if (!emailObj[fieldKey] || typeof emailObj[fieldKey] !== 'string') {
              throw new Error(`Missing or invalid field ${fieldKey} inside ${emailKey}`);
            }
          }
        }

        return draft;
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'DRAFTING',
          error_message: `Step 2 (generate-sequence) failed: ${err.message || String(err)}`,
          error_payload: { error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    // STEP 3: save-draft
    const draftId = await step.run('save-draft', async () => {
      try {
        const { data: draftData, error: draftError } = await supabase
          .from('outbound_drafts')
          .insert({
            lead_id,
            email_1_subject_a: sequence.email_1.subject_a,
            email_1_subject_b: sequence.email_1.subject_b,
            email_1_body: sequence.email_1.body,
            email_2_subject_a: sequence.email_2.subject_a,
            email_2_subject_b: sequence.email_2.subject_b,
            email_2_body: sequence.email_2.body,
            email_3_subject_a: sequence.email_3.subject_a,
            email_3_subject_b: sequence.email_3.subject_b,
            email_3_body: sequence.email_3.body,
            delivery_status: 'STAGED' as const,
          })
          .select('id')
          .single();

        if (draftError || !draftData) {
          throw new Error(`Failed to insert outbound draft: ${draftError?.message}`);
        }

        const { error: updateError } = await supabase
          .from('aoe_pipeline_leads')
          .update({ status: 'DRAFTED' })
          .eq('id', lead_id);

        if (updateError) {
          throw new Error(`Failed to transition lead status to DRAFTED: ${updateError.message}`);
        }

        await inngest.send(AOE_EVENTS.LEAD_DRAFTED.create({ lead_id, draft_id: draftData.id }));

        return draftData.id;
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'DRAFTING',
          error_message: `Step 3 (save-draft) failed: ${err.message || String(err)}`,
          error_payload: { error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    console.log(`[Drafting Worker] Created draft ${draftId} for lead ${lead_id}.`);
    return { status: 'success', lead_id, draft_id: draftId };
  }
);
