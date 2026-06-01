import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectDetailClient } from "./project-detail-client";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const supabase = await createClient();

  const [{ data: project }, { data: tasks }, { data: milestones }, { data: profiles }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, clients(id, company_name)")
      .eq("id", id)
      .single(),
    supabase
      .from("tasks")
      .select("*, profiles:assigned_to(full_name, avatar_url)")
      .eq("project_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("milestones")
      .select("*")
      .eq("project_id", id)
      .order("due_date", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .order("full_name", { ascending: true })
  ]);

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetailClient 
      initialProject={project}
      initialTasks={tasks || []}
      initialMilestones={milestones || []}
      teamProfiles={profiles || []}
    />
  );
}
