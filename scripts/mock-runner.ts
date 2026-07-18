import path from 'path';
import dotenv from 'dotenv';
import dns from 'dns';

// Force DNS resolution to prefer IPv4 to avoid IPv6 connection timeout issues
dns.setDefaultResultOrder('ipv4first');

// Preload environment variables before importing Supabase or Inngest modules
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Inject non-placeholder mock values for testing to bypass placeholder checks in workers
process.env.OPS_API_URL = '';
process.env.OPS_API_SECRET = 'aoe-secret-key-12345';
process.env.FIRECRAWL_API_KEY = 'fc-mock-key';
process.env.GEMINI_API_KEY = 'gemini-mock-key';

async function runMockPipeline() {
  const startTime = Date.now();
  console.log('CLI Arguments:', process.argv);
  const shouldCleanup = process.argv.includes('--cleanup') || process.argv.includes('cleanup');

  console.log('====================================================');
  console.log('     AOE LOCAL END-TO-END PIPELINE TEST RUNNER      ');
  console.log('====================================================\n');

  // Load modules dynamically after environment variables have been preloaded
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { AOE_EVENTS } = await import('@/lib/inngest/events');
  const { setupFirecrawlMock } = await import('./mocks/firecrawl.mock');
  const { setupGeminiMock } = await import('./mocks/gemini.mock');
  const { setupOpsPushMock } = await import('./mocks/ops-push.mock');

  const { enrichmentWorker } = await import('@/lib/inngest/workers/enrichment');
  const { qualificationWorker } = await import('@/lib/inngest/workers/qualification');
  const { draftingWorker } = await import('@/lib/inngest/workers/drafting');
  const { opsPushWorker } = await import('@/lib/inngest/workers/ops-push');

  console.log('[Setup] Applying mock overrides for Firecrawl, Gemini, Ops Push, and Inngest...');
  setupFirecrawlMock();
  setupGeminiMock();
  setupOpsPushMock();

  console.log('[Setup] Initialization completed.');

  const mockStep = {
    run: async (name: string, fn: () => Promise<any>) => {
      console.log(`    -> Step: [${name}]`);
      return await fn();
    },
  };

  const stageResults: Record<string, 'PASS' | 'FAIL'> = {
    Ingest: 'FAIL',
    Enrichment: 'FAIL',
    Qualification: 'FAIL',
    Drafting: 'FAIL',
    OpsPush: 'FAIL',
  };

  let leadId = '';
  let draftId = '';

  try {
    // Clean up any old test run first
    await supabase.from('aoe_pipeline_leads').delete().eq('company_url', 'https://scaleops-mock.io');

    // Ensure ICP config exists / upsert to avoid duplicate key errors on repeated test runs
    const { data: existingIcp } = await supabase.from('icp_config').select('*').limit(1).maybeSingle();
    console.log('[Setup] Upserting default test ICP configuration...');
    const icpPayload = {
      ...(existingIcp?.id ? { id: existingIcp.id } : {}),
      target_industries: ['SaaS', 'DevOps', 'Technology'],
      excluded_industries: ['Gaming', 'Retail'],
      excluded_keywords: ['Gambling', 'Crypto'],
      target_geographies: ['US', 'Europe', 'Canada'],
      icp_description: 'We target well-funded B2B SaaS and DevOps companies expanding engineering infrastructure.',
      service_framework: 'We automate DevOps continuous deployment pipelines and optimize cloud infrastructure costs.',
    };
    const { error: icpError } = await supabase.from('icp_config').upsert(icpPayload);
    if (icpError) {
      throw new Error(`Failed to upsert test ICP configuration: ${icpError.message}`);
    }

    // STAGE 1: Ingest
    console.log('\n--- STAGE 1: Ingest ---');
    const leadPayload = {
      company_name: 'ScaleOps',
      company_url: 'https://scaleops-mock.io',
      contact_email: 'cto@scaleops-mock.io',
      contact_name: 'Jordan Lee',
      contact_title: 'CTO',
      status: 'PENDING' as const,
    };

    const { data: insertedLead, error: ingestError } = await supabase
      .from('aoe_pipeline_leads')
      .insert(leadPayload)
      .select('*')
      .single();

    if (ingestError || !insertedLead) {
      throw new Error(`Failed to insert test lead: ${ingestError?.message}`);
    }

    leadId = insertedLead.id;
    if (!leadId) {
      throw new Error('Inserted lead ID is missing or undefined.');
    }
    console.log(`[Status Check] Lead created with ID: ${leadId} | Status: ${insertedLead.status}`);
    if (insertedLead.status === 'PENDING') {
      stageResults.Ingest = 'PASS';
    }

    // STAGE 2: Enrichment
    console.log('\n--- STAGE 2: Enrichment Worker ---');
    await (enrichmentWorker as any)['fn']({
      event: { name: AOE_EVENTS.LEAD_INGESTED.name, data: { lead_id: leadId } } as any,
      step: mockStep as any,
    });

    const { data: enrichedLead } = await supabase.from('aoe_pipeline_leads').select('status, strategic_hook, primary_pain_point').eq('id', leadId).single();
    console.log(`[Status Check] Lead Status after Enrichment: ${enrichedLead?.status}`);
    console.log(`  Extracted Hook: "${enrichedLead?.strategic_hook}"`);
    if (enrichedLead?.status === 'ENRICHED') {
      stageResults.Enrichment = 'PASS';
    }

    // STAGE 3: Qualification
    console.log('\n--- STAGE 3: Qualification Worker ---');
    await (qualificationWorker as any)['fn']({
      event: { name: AOE_EVENTS.LEAD_ENRICHED.name, data: { lead_id: leadId } } as any,
      step: mockStep as any,
    });

    const { data: qualifiedLead } = await supabase.from('aoe_pipeline_leads').select('status').eq('id', leadId).single();
    console.log(`[Status Check] Lead Status after Qualification: ${qualifiedLead?.status}`);
    if (qualifiedLead?.status === 'QUALIFIED') {
      stageResults.Qualification = 'PASS';
    }

    // STAGE 4: Drafting
    console.log('\n--- STAGE 4: Drafting Worker ---');
    const draftingOutput = await (draftingWorker as any)['fn']({
      event: { name: AOE_EVENTS.LEAD_QUALIFIED.name, data: { lead_id: leadId } } as any,
      step: mockStep as any,
    });

    draftId = draftingOutput?.draft_id || '';
    const { data: draftedLead } = await supabase.from('aoe_pipeline_leads').select('status').eq('id', leadId).single();
    console.log(`[Status Check] Lead Status after Drafting: ${draftedLead?.status} | Draft ID: ${draftId}`);
    if (draftedLead?.status === 'DRAFTED' && draftId) {
      stageResults.Drafting = 'PASS';
    }

    // STAGE 5: Ops Push
    console.log('\n--- STAGE 5: Ops Push Worker ---');
    await (opsPushWorker as any)['fn']({
      event: { name: AOE_EVENTS.LEAD_DRAFTED.name, data: { lead_id: leadId, draft_id: draftId } } as any,
      step: mockStep as any,
    });

    const { data: finalDraft } = await supabase.from('outbound_drafts').select('*').eq('id', draftId).single();
    const { data: pushedLead } = await supabase.from('aoe_pipeline_leads').select('status').eq('id', leadId).single();
    console.log(`[Status Check] Lead Status after Ops Push: ${pushedLead?.status} | Draft Delivery Status: ${finalDraft?.delivery_status}`);
    if (pushedLead?.status === 'PUSHED_TO_OPS' && finalDraft?.delivery_status === 'PUSHED') {
      stageResults.OpsPush = 'PASS';
    }

    // FINAL SUMMARY REPORT
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const { data: finalLead } = await supabase.from('aoe_pipeline_leads').select('status').eq('id', leadId).single();

    console.log('\n====================================================');
    console.log('                 FINAL RUN SUMMARY                  ');
    console.log('====================================================');
    console.log(`Total Execution Time: ${totalTime}s`);
    console.log(`Final Lead Status:    ${finalLead?.status}`);
    console.log('\nStage Verification:');
    for (const [stage, res] of Object.entries(stageResults)) {
      console.log(`  - ${stage.padEnd(14)} : [${res}]`);
    }

    console.log('\nFull Outbound Drafts Row (JSON):');
    console.log(JSON.stringify(finalDraft || {}, null, 2));
    console.log('====================================================\n');

  } catch (err: any) {
    console.error('\n[Pipeline Test Fatal Error]:', err.message || err);
  } finally {
    if (shouldCleanup) {
      console.log(`[Cleanup] --cleanup flag detected. Deleting test lead by company_url 'https://scaleops-mock.io'...`);
      await supabase.from('aoe_pipeline_leads').delete().eq('company_url', 'https://scaleops-mock.io');
      console.log('[Cleanup] Complete.\n');
    }
  }
}

runMockPipeline();
