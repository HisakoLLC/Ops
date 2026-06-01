import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./reports-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TimeReportsPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const isAdmin = profile?.role === "admin";
  if (!isAdmin) {
    redirect("/time");
  }

  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*, clients(id, company_name, pipeline_value), profiles:logged_by(id, full_name, hourly_cost)")
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <ReportsClient entries={timeEntries || []} />
    </div>
  );
}
