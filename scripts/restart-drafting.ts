import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { inngest } from '../src/lib/inngest/client';
import { AOE_EVENTS } from '../src/lib/inngest/events';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function restartDraftingLeads() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Fetching leads stuck in DRAFTING...');
  const { data: stuckLeads, error } = await supabase
    .from('aoe_pipeline_leads')
    .select('id, company_name, status')
    .eq('status', 'DRAFTING');

  if (error) {
    console.error('Error fetching stuck leads:', error.message);
    return;
  }

  if (!stuckLeads || stuckLeads.length === 0) {
    console.log('No leads currently stuck in DRAFTING.');
    return;
  }

  console.log(`Found ${stuckLeads.length} lead(s) stuck in DRAFTING:`);
  stuckLeads.forEach((l) => console.log(` - [${l.id}] ${l.company_name}`));

  for (const lead of stuckLeads) {
    // Reset status to QUALIFIED so the drafting worker can pick it up
    const { error: updateError } = await supabase
      .from('aoe_pipeline_leads')
      .update({ status: 'QUALIFIED' })
      .eq('id', lead.id);

    if (updateError) {
      console.error(`Failed to update status for ${lead.company_name}:`, updateError.message);
      continue;
    }

    console.log(`Reset status to QUALIFIED for ${lead.company_name}. Sending LEAD_QUALIFIED event...`);

    try {
      await inngest.send(AOE_EVENTS.LEAD_QUALIFIED.create({ lead_id: lead.id }));
      console.log(`✓ Triggered drafting event for ${lead.company_name}`);
    } catch (err: any) {
      console.error(`Failed to send event for ${lead.company_name}:`, err.message || err);
    }
  }

  console.log('\nAll stuck leads reset & re-queued for drafting successfully!');
}

restartDraftingLeads();
