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

export const qualificationWorker = inngest.createFunction(
  {
    id: 'aoe-qualification-worker',
    name: 'AOE Lead Qualification Worker',
    retries: 3,
    triggers: [{ event: AOE_EVENTS.LEAD_ENRICHED }],
  },
  async ({ event, step }) => {
    const { lead_id } = event.data;
    const supabase = getSupabase();

    // STEP 1: fetch-lead-and-icp
    const fetched = await step.run('fetch-lead-and-icp', async () => {
      try {
        const { data: lead, error: leadError } = await supabase
          .from('aoe_pipeline_leads')
          .select('*')
          .eq('id', lead_id)
          .single();

        if (leadError || !lead) {
          console.warn(`[Qualification Worker] Lead not found: ${lead_id}`);
          return null;
        }

        if (lead.status !== 'ENRICHED') {
          console.log(`[Qualification Worker] Lead ${lead_id} is not ENRICHED (Status: ${lead.status}). Returning early.`);
          return null;
        }

        const { data: icp, error: icpError } = await supabase
          .from('icp_config')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (icpError) {
          throw new Error(`Failed to fetch icp_config: ${icpError.message}`);
        }

        const { error: updateError } = await supabase
          .from('aoe_pipeline_leads')
          .update({ status: 'QUALIFYING' })
          .eq('id', lead_id);

        if (updateError) {
          throw new Error(`Failed to update status to QUALIFYING: ${updateError.message}`);
        }

        return { lead, icp: icp || {} as any };
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'QUALIFICATION',
          error_message: `Step 1 (fetch-lead-and-icp) failed: ${err.message || String(err)}`,
          error_payload: { error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    if (!fetched) {
      return { status: 'skipped_or_not_found', lead_id };
    }

    const { lead, icp } = fetched;

    // STEP 2: run-tier-1-filters
    const tier1Result = await step.run('run-tier-1-filters', async () => {
      try {
        const enrichmentStr = JSON.stringify(lead.enrichment_data || {}).toLowerCase();
        const companyNameStr = (lead.company_name || '').toLowerCase();
        const fullSearchStr = `${companyNameStr} ${enrichmentStr}`;

        const logsToInsert: Array<{
          lead_id: string;
          tier: 1 | 2;
          result: 'PASS' | 'FAIL';
          reason: string;
        }> = [];

        let failReason: string | null = null;

        // Check 1: Excluded Industries
        const excludedIndustries: string[] = icp.excluded_industries || [];
        for (const ind of excludedIndustries) {
          if (ind && enrichmentStr.includes(ind.toLowerCase())) {
            failReason = `Excluded industry match: ${ind}`;
            break;
          }
        }
        logsToInsert.push({
          lead_id, tier: 1,
          result: failReason ? 'FAIL' : 'PASS',
          reason: failReason || 'Passed excluded industries check',
        });

        // Check 2: Excluded Keywords
        if (!failReason) {
          const excludedKeywords: string[] = icp.excluded_keywords || [];
          for (const kw of excludedKeywords) {
            if (kw && fullSearchStr.includes(kw.toLowerCase())) {
              failReason = `Excluded keyword match: ${kw}`;
              break;
            }
          }
          if (failReason) {
            logsToInsert.push({ lead_id, tier: 1, result: 'FAIL', reason: failReason });
          } else {
            logsToInsert.push({ lead_id, tier: 1, result: 'PASS', reason: 'Passed excluded keywords check' });
          }
        }

        // Check 3: Geography
        if (!failReason) {
          const targetGeos: string[] = icp.target_geographies || [];
          if (targetGeos.length > 0) {
            const hasGeoSignal = targetGeos.some(geo => geo && fullSearchStr.includes(geo.toLowerCase()));
            if (!hasGeoSignal) {
              failReason = 'No target geography signal found';
              logsToInsert.push({ lead_id, tier: 1, result: 'FAIL', reason: failReason });
            } else {
              logsToInsert.push({ lead_id, tier: 1, result: 'PASS', reason: 'Passed target geographies check' });
            }
          } else {
            logsToInsert.push({ lead_id, tier: 1, result: 'PASS', reason: 'No target geographies configured (passed)' });
          }
        }

        // Check 4: Contact Email Validity
        if (!failReason) {
          if (lead.contact_email) {
            const email = lead.contact_email.trim().toLowerCase();
            const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const prefix = email.split('@')[0];
            const genericPrefixes = ['info', 'hello', 'support', 'admin', 'contact'];

            if (!basicRegex.test(email) || genericPrefixes.includes(prefix)) {
              failReason = 'Generic or invalid contact email';
              logsToInsert.push({ lead_id, tier: 1, result: 'FAIL', reason: failReason });
            } else {
              logsToInsert.push({ lead_id, tier: 1, result: 'PASS', reason: 'Passed contact email validity check' });
            }
          } else {
            logsToInsert.push({ lead_id, tier: 1, result: 'PASS', reason: 'No contact email provided (passed)' });
          }
        }

        if (logsToInsert.length > 0) {
          const { error: logError } = await supabase.from('qualification_logs').insert(logsToInsert);
          if (logError) {
            console.error(`[Qualification Worker] Failed to insert Tier 1 logs:`, logError.message);
          }
        }

        if (failReason) {
          await supabase
            .from('aoe_pipeline_leads')
            .update({ status: 'DISQUALIFIED', disqualification_reason: failReason })
            .eq('id', lead_id);

          return { passed: false, reason: failReason };
        }

        return { passed: true, reason: undefined as string | undefined };
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'QUALIFICATION',
          error_message: `Step 2 (run-tier-1-filters) failed: ${err.message || String(err)}`,
          error_payload: { error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    if (!tier1Result.passed) {
      console.log(`[Qualification Worker] Lead ${lead_id} disqualified at Tier 1: ${tier1Result.reason}`);
      return { status: 'disqualified', tier: 1, reason: tier1Result.reason, lead_id };
    }

    // STEP 3: run-tier-2-llm
    const tier2Result = await step.run('run-tier-2-llm', async () => {
      try {
        const icpConfig = icp;
        const enrichment = (lead.enrichment_data as Record<string, any>) || {};
        const prompt = `You are a B2B sales qualification expert.
Evaluate whether this company is a strong ICP fit.

ICP Definition:
${icpConfig.icp_description}

Company Intelligence:
- Value Proposition: ${enrichment.value_proposition}
- Primary Pain Point: ${lead.primary_pain_point}
- Strategic Hook: ${lead.strategic_hook}
- Scaling Signals: ${enrichment.scaling_signals}
- Raw Context: ${JSON.stringify(lead.enrichment_data).slice(0, 3000)}

Return ONLY a JSON object:
{
  "qualified": true or false,
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "reason": "One sentence explanation"
}`;

        const qualification = await generateJSON<{
          qualified: boolean;
          confidence: 'HIGH' | 'MEDIUM' | 'LOW';
          reason: string;
        }>(prompt);

        if (typeof qualification.qualified !== 'boolean' || !qualification.confidence || !qualification.reason) {
          throw new Error('Invalid JSON structure returned by LLM in Tier 2 qualification.');
        }

        const isPassed = qualification.qualified && (qualification.confidence === 'HIGH' || qualification.confidence === 'MEDIUM');

        await supabase.from('qualification_logs').insert({
          lead_id,
          tier: 2,
          result: isPassed ? 'PASS' : 'FAIL',
          reason: qualification.reason,
          llm_raw_response: qualification as any,
        });

        if (!isPassed) {
          const disqReason = `Tier 2 LLM Disqualification (${qualification.confidence} confidence): ${qualification.reason}`;
          await supabase
            .from('aoe_pipeline_leads')
            .update({ status: 'DISQUALIFIED', disqualification_reason: disqReason })
            .eq('id', lead_id);

          return { qualified: false, reason: disqReason };
        }

        await supabase.from('aoe_pipeline_leads').update({ status: 'QUALIFIED' }).eq('id', lead_id);

        await inngest.send(AOE_EVENTS.LEAD_QUALIFIED.create({ lead_id }));

        return { qualified: true, reason: undefined as string | undefined };
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'QUALIFICATION',
          error_message: `Step 3 (run-tier-2-llm) failed: ${err.message || String(err)}`,
          error_payload: { error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    if (!tier2Result.qualified) {
      console.log(`[Qualification Worker] Lead ${lead_id} disqualified at Tier 2: ${tier2Result.reason}`);
      return { status: 'disqualified', tier: 2, reason: tier2Result.reason, lead_id };
    }

    console.log(`[Qualification Worker] Lead ${lead_id} fully QUALIFIED!`);
    return { status: 'success', lead_id };
  }
);
