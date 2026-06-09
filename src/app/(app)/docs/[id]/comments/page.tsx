import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CommentsClient } from "./comments-client";

export const dynamic = "force-dynamic";

export default async function CommentsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: doc } = await supabase.from('docs').select('id, title').eq('id', id).single();
  
  if (!doc) notFound();

  const { data: comments } = await supabase
    .from('doc_comments')
    .select('*')
    .eq('doc_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <CommentsClient doc={doc} initialComments={comments || []} />
    </div>
  );
}
