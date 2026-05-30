import { createClient } from "@/lib/supabase/server";
import { ClientListClient } from "./client-list-client";
import { Client } from "@/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select(`
      *,
      activities ( created_at )
    `)
    .order("created_at", { ascending: false });

  // Process last activity
  const clientsWithLastActivity = (clients || []).map((client) => {
    const sortedActivities = client.activities?.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const lastActivity = sortedActivities?.[0]?.created_at || null;
    return {
      ...client,
      lastActivity
    };
  });

  return (
    <div className="space-y-6">
      <ClientListClient initialClients={clientsWithLastActivity as unknown as Client[]} />
    </div>
  );
}
