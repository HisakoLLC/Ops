import { createClient } from "@/lib/supabase/server";
import { DocEditor } from "@/components/docs/DocEditor";

export const dynamic = "force-dynamic";

export default async function NewDocPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single();

  const { data: products } = await supabase.from('doc_products').select('*');
  const { data: sections } = await supabase.from('doc_sections').select('*');

  return (
    <div className="h-[calc(100vh-64px)] w-full -m-6">
      <DocEditor 
        initialDoc={null} 
        products={products || []}
        sections={sections || []}
        userProfile={profile}
      />
    </div>
  );
}
