import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { enrichmentWorker } from '@/lib/inngest/workers/enrichment';
import { qualificationWorker } from '@/lib/inngest/workers/qualification';
import { draftingWorker } from '@/lib/inngest/workers/drafting';
import { opsPushWorker } from '@/lib/inngest/workers/ops-push';

// AOE Pipeline — Inngest serve endpoint
// Registered workers: Enrichment → Qualification → Drafting → Ops Push
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    enrichmentWorker,
    qualificationWorker,
    draftingWorker,
    opsPushWorker,
  ],
});
