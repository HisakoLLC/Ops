import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { KBEditorClient } from "../../../kb-editor-client";

export const dynamic = "force-dynamic";

export default async function KBEditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user?.id).single();
  
  if (profile?.role !== 'admin') {
    redirect(`/kb/article/${resolvedParams.slug}`);
  }

  const { data: article } = await supabase.from('kb_articles').select('*').eq('slug', resolvedParams.slug).single();
  if (!article) notFound();

  const { data: categories } = await supabase.from('kb_categories').select('*').order('sort_order', { ascending: true });

  return (
    <div className="flex h-full flex-col">
      <KBEditorClient 
        article={article} 
        categories={categories || []} 
        currentUserId={userData.user?.id || ''} 
      />
    </div>
  );
}
