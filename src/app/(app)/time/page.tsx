import { createClient } from "@/lib/supabase/server";
import { TimeClient } from "./time-client";
import { startOfWeek, endOfWeek } from "date-fns";

export const dynamic = "force-dynamic";

export default async function TimePage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const isAdmin = profile?.role === "admin";

  const [
    { data: timeEntries },
    { data: clients },
    { data: projects },
    { data: tasks },
    { data: teamProfiles }
  ] = await Promise.all([
    supabase
      .from("time_entries")
      .select("*, clients(id, company_name), projects(id, name), tasks(id, title), profiles:logged_by(id, full_name, avatar_url)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, company_name").order("company_name", { ascending: true }),
    supabase.from("projects").select("id, name, client_id").order("name", { ascending: true }),
    supabase.from("tasks").select("id, title, project_id").order("title", { ascending: true }),
    supabase.from("profiles").select("id, full_name, avatar_url")
  ]);

  // Filter entries if not admin (admin sees all, member sees own)
  const entriesToPass = isAdmin ? timeEntries : (timeEntries || []).filter((e: any) => e.logged_by === userId);

  return (
    <div className="space-y-6">
      <TimeClient 
        initialEntries={entriesToPass || []}
        clients={clients || []}
        projects={projects || []}
        tasks={tasks || []}
        teamProfiles={teamProfiles || []}
        currentUserId={userId as string}
        isAdmin={isAdmin}
      />
    </div>
  );
}
