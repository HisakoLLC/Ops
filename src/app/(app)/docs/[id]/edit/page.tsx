import { createClient } from "@/lib/supabase/server";
import { DocEditor } from "@/components/docs/DocEditor";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditDocPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single();

  const { data: doc } = await supabase.from('docs').select('*').eq('id', id).single();
  
  if (!doc) notFound();

  const { data: products } = await supabase.from('doc_products').select('*');
  const { data: sections } = await supabase.from('doc_sections').select('*');

  return (
    <div className="h-[calc(100vh-64px)] w-full -m-6">
      <DocEditor 
        initialDoc={doc} 
        products={products || []}
        sections={sections || []}
        userProfile={profile}
      />
    </div>
  );
}
