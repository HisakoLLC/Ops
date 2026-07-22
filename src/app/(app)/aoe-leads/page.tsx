import { createClient } from "@/lib/supabase/server";
import { AoeLeadsClient } from "./aoe-leads-client";

export const dynamic = "force-dynamic";

export default async function AoeLeadsPage() {
  const supabase = await createClient();

  const { data: aoeLeads } = await supabase
    .from("aoe_leads")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch pipeline leads that were disqualified
  const { data: pipelineDisqualified } = await supabase
    .from("aoe_pipeline_leads")
    .select("*")
    .eq("status", "DISQUALIFIED");

  const existingIds = new Set((aoeLeads || []).map((l: any) => l.aoe_lead_id));
  const existingUrls = new Set((aoeLeads || []).map((l: any) => l.company_url?.toLowerCase()));

  const mergedDisqualified = (pipelineDisqualified || [])
    .filter(
      (p) =>
        !existingIds.has(p.id) &&
        (!p.company_url || !existingUrls.has(p.company_url.toLowerCase()))
    )
    .map((p) => {
      const enrichment = (p.enrichment_data || {}) as Record<string, any>;
      return {
        id: p.id,
        aoe_lead_id: p.id,
        aoe_draft_id: "",
        source: "AOE",
        status: "DISQUALIFIED" as const,
        contact_name: p.contact_name || null,
        contact_title: p.contact_title || null,
        contact_email: p.contact_email || null,
        company_name: p.company_name || null,
        company_url: p.company_url || null,
        value_proposition: enrichment.value_proposition || null,
        target_audience: enrichment.target_audience || null,
        scaling_signals: enrichment.scaling_signals || null,
        strategic_hook: p.strategic_hook || null,
        primary_pain_point: p.primary_pain_point || null,
        qualification_confidence: "LOW" as const,
        qualification_reason: p.disqualification_reason || "Disqualified during AI qualification check",
        tier_1_passed: false,
        tier_2_passed: false,
        email_1_subject_a: null,
        email_1_subject_b: null,
        email_1_body: null,
        email_2_subject_a: null,
        email_2_subject_b: null,
        email_2_body: null,
        email_3_subject_a: null,
        email_3_subject_b: null,
        email_3_body: null,
        selected_subject_1: null,
        selected_subject_2: null,
        selected_subject_3: null,
        edited_body_1: null,
        edited_body_2: null,
        edited_body_3: null,
        notes: null,
        reviewed_by: null,
        converted_to_client_id: null,
        sent_at_1: null,
        sent_at_2: null,
        sent_at_3: null,
        replied_at: null,
        ingested_at: p.created_at,
        drafted_at: null,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });

  const allLeads = [...(aoeLeads || []), ...mergedDisqualified];

  const { data: icpConfig } = await supabase
    .from("icp_config")
    .select("*")
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <AoeLeadsClient 
        initialLeads={allLeads} 
        initialIcpConfig={icpConfig}
      />
    </div>
  );
}

