import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { KBEditorClient } from "../kb-editor-client";

export const dynamic = "force-dynamic";

export default async function KBNewArticlePage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user?.id).single();
  
  if (profile?.role !== 'admin') {
    redirect("/kb");
  }

  const { data: categories } = await supabase.from('kb_categories').select('*').order('sort_order', { ascending: true });

  return (
    <div className="flex h-full flex-col">
      <KBEditorClient 
        article={null} 
        categories={categories || []} 
        currentUserId={userData.user?.id || ''} 
      />
    </div>
  );
}
