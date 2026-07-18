import { inngest } from '../client';
import { AOE_EVENTS } from '../events';
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';
import { generateJSON } from '@/lib/gemini/client';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

interface ExtractedIntelligence {
  value_proposition: string;
  target_audience: string;
  scaling_signals: string;
  strategic_hook: string;
  primary_pain_point: string;
}

export const enrichmentWorker = inngest.createFunction(
  {
    id: 'aoe-enrichment-worker',
    name: 'AOE Lead Enrichment Worker',
    retries: 3,
    triggers: [{ event: AOE_EVENTS.LEAD_INGESTED }],
  },
  async ({ event, step }) => {
    const { lead_id } = event.data;
    const supabase = getSupabase();

    // STEP 1: fetch-lead
    const lead = await step.run('fetch-lead', async () => {
      try {
        const { data, error } = await supabase
          .from('aoe_pipeline_leads')
          .select('*')
          .eq('id', lead_id)
          .single();

        if (error || !data) {
          console.warn(`[Enrichment Worker] Lead not found: ${lead_id}`);
          return null;
        }

        if (data.status !== 'PENDING') {
          console.log(`[Enrichment Worker] Lead ${lead_id} is not PENDING (Status: ${data.status}). Returning early.`);
          return null;
        }

        const { error: updateError } = await supabase
          .from('aoe_pipeline_leads')
          .update({ status: 'ENRICHING' })
          .eq('id', lead_id);

        if (updateError) {
          throw new Error(`Failed to transition lead status to ENRICHING: ${updateError.message}`);
        }

        return data;
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'ENRICHMENT',
          error_message: `Step 1 (fetch-lead) failed: ${err.message || String(err)}`,
          error_payload: { error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    if (!lead) {
      return { status: 'skipped_or_not_found', lead_id };
    }

    // STEP 2: scrape-company-site
    const markdownContent = await step.run('scrape-company-site', async () => {
      try {
        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey || apiKey.includes('placeholder')) {
          throw new Error('FIRECRAWL_API_KEY is missing or invalid.');
        }

        const firecrawl = new FirecrawlApp({ apiKey });
        const scrapeResult = await firecrawl.scrapeUrl(lead.company_url, {
          formats: ['markdown'],
          onlyMainContent: true,
          excludeTags: ['nav', 'footer', 'header', 'script', 'style'],
        }) as any;

        if (!scrapeResult.success || !scrapeResult.markdown) {
          throw new Error(`Firecrawl scrape failed: ${scrapeResult.error || 'No markdown returned'}`);
        }

        return scrapeResult.markdown as string;
      } catch (err: any) {
        // Log the failure but do not crash the worker. Fallback to general intelligence.
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'ENRICHMENT',
          error_message: `Step 2 (scrape-company-site) failed, using general knowledge fallback: ${err.message || String(err)}`,
          error_payload: { url: lead.company_url, error: String(err) },
          resolved: true,
        });

        console.warn(`[Enrichment Worker] Firecrawl failed for ${lead.company_url}: ${err.message}. Using fallback.`);
        return `Company Name: ${lead.company_name}
Website: ${lead.company_url}
Note: Scraper failed to fetch site content. Rely on general pre-trained knowledge about this company and its industry to qualify and draft outreach copy.`;
      }
    });

    // STEP 3: extract-intelligence
    const extracted = await step.run('extract-intelligence', async () => {
      try {
        const prompt = `You are a B2B intelligence analyst. 
From the following company website content, extract exactly:

1. value_proposition: One sentence. What does this company 
   do and who do they serve?
2. target_audience: One sentence. Who are their customers?
3. scaling_signals: One to two sentences. What operational 
   scaling pain points are visible? Look for: active hiring 
   mentions, new product launches, funding announcements, 
   or geographic expansion language.
4. strategic_hook: One sentence. The single most compelling 
   angle for a cold outreach opener targeting this company.
5. primary_pain_point: One sentence. The most likely 
   operational pain point this company faces right now.

Company website content:
${markdownContent.slice(0, 8000)}

Return ONLY a JSON object with these exact keys:
value_proposition, target_audience, scaling_signals, 
strategic_hook, primary_pain_point`;

        const intelligence = await generateJSON<{
          value_proposition: string;
          target_audience: string;
          scaling_signals: string;
          strategic_hook: string;
          primary_pain_point: string;
        }>(prompt);

        const requiredFields: (keyof ExtractedIntelligence)[] = [
          'value_proposition', 'target_audience', 'scaling_signals',
          'strategic_hook', 'primary_pain_point',
        ];

        for (const field of requiredFields) {
          if (!intelligence[field] || typeof intelligence[field] !== 'string') {
            throw new Error(`Missing or invalid required field in LLM JSON response: ${field}`);
          }
        }

        return intelligence;
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'ENRICHMENT',
          error_message: `Step 3 (extract-intelligence) failed: ${err.message || String(err)}`,
          error_payload: { error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    // STEP 4: update-lead
    await step.run('update-lead', async () => {
      try {
        const enrichmentPayload = {
          raw_markdown: markdownContent.slice(0, 10000),
          value_proposition: extracted.value_proposition,
          target_audience: extracted.target_audience,
          scaling_signals: extracted.scaling_signals,
        };

        const { error: updateError } = await supabase
          .from('aoe_pipeline_leads')
          .update({
            enrichment_data: enrichmentPayload,
            strategic_hook: extracted.strategic_hook,
            primary_pain_point: extracted.primary_pain_point,
            status: 'ENRICHED',
          })
          .eq('id', lead_id);

        if (updateError) {
          throw new Error(`Failed to update lead row with enriched intelligence: ${updateError.message}`);
        }

        await inngest.send(AOE_EVENTS.LEAD_ENRICHED.create({ lead_id }));
      } catch (err: any) {
        await supabase.from('error_logs').insert({
          lead_id,
          worker: 'ENRICHMENT',
          error_message: `Step 4 (update-lead) failed: ${err.message || String(err)}`,
          error_payload: { error: String(err) },
          resolved: false,
        });
        throw err;
      }
    });

    console.log(`[Enrichment Worker] Successfully enriched lead: ${lead_id}`);
    return { status: 'success', lead_id };
  }
);
