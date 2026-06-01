import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { FinanceClient } from "./finance-client";
import { Client, Invoice, Expense } from "@/types";

export const metadata = {
  title: "Finance | Hisako Ops",
  description: "Manage revenue, invoices, and expenses",
};

export default async function FinancePage() {
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

  // Fetch clients to compute MRR and pipeline value
  const { data: clients } = await supabase
    .from("clients")
    .select("*");

  // Fetch invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, clients(company_name, contact_email)")
    .order("created_at", { ascending: false });

  // Fetch expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl">
      <FinanceClient 
        clients={(clients as Client[]) || []}
        initialInvoices={(invoices as (Invoice & { clients: { company_name: string, contact_email: string } })[]) || []}
        initialExpenses={(expenses as Expense[]) || []}
        currentUserId={session.user.id}
      />
    </div>
  );
}
