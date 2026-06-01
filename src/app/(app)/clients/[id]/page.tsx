import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientProfileClient } from "./client-profile-client";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const supabase = await createClient();

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Fetch activities
  const { data: activities } = await supabase
    .from("activities")
    .select(`
      *,
      profiles:created_by (full_name, avatar_url)
    `)
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  // Fetch documents
  const { data: documents } = await supabase
    .from("documents")
    .select(`
      *,
      profiles:created_by (full_name)
    `)
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  // Fetch invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  // Fetch vendors
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .eq("client_id", id)
    .order("name", { ascending: true });

  // Fetch projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*, tasks(id, status)")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  // Fetch time entries with profiles for hourly cost
  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*, profiles:logged_by(hourly_cost), projects(phase)")
    .eq("client_id", id);

  return (
    <ClientProfileClient 
      initialClient={client} 
      initialActivities={activities || []} 
      initialDocuments={documents || []} 
      initialInvoices={invoices || []}
      initialVendors={vendors || []}
      initialProjects={projects || []}
      initialTimeEntries={timeEntries || []}
    />
  );
}
