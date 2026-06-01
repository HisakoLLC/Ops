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

  return (
    <div className="mx-auto max-w-7xl">
      <LeadListClient 
        initialLeads={(leads as Lead[]) || []} 
        profiles={(profiles as Profile[]) || []}
        currentUserId={session.user.id}
      />
    </div>
  );
}
