import { createClient } from "@/lib/supabase/server";
import { KBSidebar } from "./kb-sidebar";

export const dynamic = "force-dynamic";

export default async function KBLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user?.id).single();
  const isAdmin = profile?.role === 'admin';

  // Fetch categories with article counts
  const { data: categories } = await supabase
    .from('kb_categories')
    .select('*, kb_articles(id)')
    .order('sort_order', { ascending: true });

  const categoriesWithCounts = (categories || []).map(c => ({
    ...c,
    articleCount: c.kb_articles?.length || 0
  }));

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] -mx-4 -my-6 lg:-mx-8 lg:-my-8">
      <KBSidebar categories={categoriesWithCounts} isAdmin={isAdmin} />
      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/50">
        {children}
      </div>
    </div>
  );
}
