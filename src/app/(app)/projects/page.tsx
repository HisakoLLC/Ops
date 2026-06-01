import { createClient } from "@/lib/supabase/server";
import { ProjectsClient } from "./projects-client";
import { Project, Client } from "@/types";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createClient();

  // Fetch projects with client details and task counts
  const [{ data: projects }, { data: clients }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, clients(company_name), tasks(id, status)")
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, company_name")
      .order("company_name", { ascending: true })
  ]);

  return (
    <div className="space-y-6">
      <ProjectsClient 
        initialProjects={projects as any[]} 
        clients={clients as any[]} 
      />
    </div>
  );
}
