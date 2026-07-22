import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { LeadListClient } from "./lead-list-client";
import { Lead, Profile } from "@/types";

export const metadata = {
  title: "Leads | Hisako Ops",
  description: "Manage sales leads and prospects",
};

export default async function LeadsPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch leads
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (leadsError) {
    console.error("Error fetching leads:", leadsError);
  }

  // Fetch team profiles for assignment
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name");

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
  }

  // Fetch AOE status mapping for each CRM lead
  const [{ data: pipelineLeads }, { data: aoeLeads }] = await Promise.all([
    supabase.from("aoe_pipeline_leads").select("company_name, contact_email, status, disqualification_reason"),
    supabase.from("aoe_leads").select("company_name, contact_email, status, qualification_reason"),
  ]);

  const initialAoeStatusMap: Record<string, { status: string; label: string; reason?: string | null }> = {};

  ((leads as Lead[]) || []).forEach((lead) => {
    const leadCompany = lead.company_name?.trim().toLowerCase();
    const leadEmail = lead.contact_email?.trim().toLowerCase();

    // 1. Check aoe_leads first
    const matchAoe = (aoeLeads || []).find((a: any) => {
      const emailMatch = leadEmail && a.contact_email?.trim().toLowerCase() === leadEmail;
      const companyMatch = leadCompany && a.company_name?.trim().toLowerCase() === leadCompany;
      return emailMatch || companyMatch;
    });

    if (matchAoe) {
      const st = matchAoe.status;
      if (st === "PENDING_REVIEW") initialAoeStatusMap[lead.id] = { status: "PENDING_REVIEW", label: "Pending Review" };
      else if (st === "APPROVED") initialAoeStatusMap[lead.id] = { status: "APPROVED", label: "Approved" };
      else if (["EMAIL_1_SENT", "EMAIL_2_SENT", "EMAIL_3_SENT"].includes(st)) initialAoeStatusMap[lead.id] = { status: "EMAIL_SENT", label: "Email Sent" };
      else if (st === "REPLIED") initialAoeStatusMap[lead.id] = { status: "REPLIED", label: "Replied" };
      else if (st === "CONVERTED") initialAoeStatusMap[lead.id] = { status: "CONVERTED", label: "Converted" };
      else if (["REJECTED", "DISQUALIFIED"].includes(st)) initialAoeStatusMap[lead.id] = { status: "DISQUALIFIED", label: "Disqualified", reason: matchAoe.qualification_reason };
      else if (st === "ARCHIVED") initialAoeStatusMap[lead.id] = { status: "ARCHIVED", label: "Archived" };
      else initialAoeStatusMap[lead.id] = { status: st, label: st.replace(/_/g, " ") };
      return;
    }

    // 2. Check aoe_pipeline_leads
    const matchPipeline = (pipelineLeads || []).find((p: any) => {
      const emailMatch = leadEmail && p.contact_email?.trim().toLowerCase() === leadEmail;
      const companyMatch = leadCompany && p.company_name?.trim().toLowerCase() === leadCompany;
      return emailMatch || companyMatch;
    });

    if (matchPipeline) {
      const st = matchPipeline.status;
      if (st === "PENDING") initialAoeStatusMap[lead.id] = { status: "PENDING", label: "Queued" };
      else if (["ENRICHING", "ENRICHED"].includes(st)) initialAoeStatusMap[lead.id] = { status: "ENRICHING", label: "Enriching" };
      else if (st === "QUALIFYING") initialAoeStatusMap[lead.id] = { status: "QUALIFYING", label: "Qualifying" };
      else if (st === "QUALIFIED") initialAoeStatusMap[lead.id] = { status: "QUALIFIED", label: "Qualified" };
      else if (["DRAFTING", "DRAFTED"].includes(st)) initialAoeStatusMap[lead.id] = { status: "DRAFTING", label: "Drafting" };
      else if (st === "DISQUALIFIED") initialAoeStatusMap[lead.id] = { status: "DISQUALIFIED", label: "Disqualified", reason: matchPipeline.disqualification_reason };
      else if (st === "PUSHED_TO_OPS") initialAoeStatusMap[lead.id] = { status: "PENDING_REVIEW", label: "Pending Review" };
      else initialAoeStatusMap[lead.id] = { status: st, label: st.replace(/_/g, " ") };
      return;
    }

    // 3. Not scanned
    initialAoeStatusMap[lead.id] = { status: "NOT_SCANNED", label: "Not Scanned" };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <LeadListClient 
        initialLeads={(leads as Lead[]) || []} 
        profiles={(profiles as Profile[]) || []}
        currentUserId={session.user.id}
        initialAoeStatusMap={initialAoeStatusMap}
      />
    </div>
  );
}

