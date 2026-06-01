import { createClient } from "@/lib/supabase/server";
import { KBHomeClient } from "../../kb-home-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KBCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ search?: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const search = (await searchParams).search;

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user?.id).single();
  const isAdmin = profile?.role === 'admin';

  const { data: category } = await supabase.from('kb_categories').select('*').eq('id', resolvedParams.id).single();
  if (!category) notFound();

  let query = supabase
    .from('kb_articles')
    .select('*, kb_categories(name, icon), profiles:created_by(full_name, avatar_url)')
    .eq('category_id', resolvedParams.id)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data: articles } = await query;
  const { count: catCount } = await supabase.from('kb_categories').select('*', { count: 'exact', head: true });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <span className="text-zinc-500 font-medium">Category:</span> <span className="font-bold text-zinc-900 dark:text-white">{category.name}</span>
      </div>
      <KBHomeClient 
        articles={articles || []} 
        search={search || ''} 
        stats={{ articles: articles?.length || 0, categories: catCount || 0 }} 
        isAdmin={isAdmin} 
      />
    </div>
  );
}
