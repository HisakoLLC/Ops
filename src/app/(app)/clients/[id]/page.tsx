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

  return (
    <ClientProfileClient 
      initialClient={client} 
      initialActivities={activities || []} 
      initialDocuments={documents || []} 
      initialInvoices={invoices || []}
    />
  );
}
