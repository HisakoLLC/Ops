import { createClient } from "@/lib/supabase/server";
import { PipelineBoardClient } from "./pipeline-board-client";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = await createClient();

  // Fetch clients that are NOT churned or inactive (usually kanban boards don't show those, or maybe they do? The prompt says "7 columns (one per pipeline stage)". PIPELINE_STAGES has 9, but usually lead, discovery, proposal, signed, build, live, retainer are the 7 active ones. Let's filter out churned and inactive)
  const { data: clients } = await supabase
    .from("clients")
    .select(`
      *,
      activities ( type, created_at, metadata )
    `)
    .not("pipeline_stage", "in", '("churned","inactive")')
    .order("updated_at", { ascending: false });

  // Process days in current stage and last activity
  const clientsWithStats = (clients || []).map((client) => {
    // Last activity
    const sortedActivities = client.activities?.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const lastActivity = sortedActivities?.[0]?.created_at || null;

    // Days in current stage
    const stageChangeActivities = sortedActivities?.filter((a: any) => 
      a.type === 'stage_change' && a.metadata?.to_stage === client.pipeline_stage
    );
    const enteredStageAt = stageChangeActivities?.[0]?.created_at || client.created_at;
    const daysInStage = Math.floor((new Date().getTime() - new Date(enteredStageAt).getTime()) / (1000 * 3600 * 24));

    return {
      ...client,
      lastActivity,
      daysInStage
    };
  });

  return (
    <PipelineBoardClient initialClients={clientsWithStats as any} />
  );
}
