import { createClient } from "@/lib/supabase/server";
import { AoeLeadsClient } from "./aoe-leads-client";

export const dynamic = "force-dynamic";

export default async function AoeLeadsPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("aoe_leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <AoeLeadsClient initialLeads={leads || []} />
    </div>
  );
}
