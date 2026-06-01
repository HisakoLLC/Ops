import { createClient } from "@/lib/supabase/server";
import { VendorsClient } from "./vendors-client";
import { Vendor, Client } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const supabase = await createClient();

  const [{ data: vendors }, { data: clients }] = await Promise.all([
    supabase
      .from("vendors")
      .select("*, clients(company_name, contact_email)")
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, company_name")
      .order("company_name", { ascending: true })
  ]);

  return (
    <div className="space-y-6">
      <VendorsClient 
        initialVendors={vendors as any[]} 
        clients={clients as any[]} 
      />
    </div>
  );
}
