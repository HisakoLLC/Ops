import { createClient } from "@/lib/supabase/server";
import { DocsClient } from "./docs-client";

export const dynamic = "force-dynamic";

export default async function DocsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ search?: string; type?: string; status?: string }> 
}) {
  const supabase = await createClient();
  const { search, type, status } = await searchParams;

  // 1. Fetch Stats
  const [
    { count: publishedCount },
    { count: draftCount },
    { count: pendingCommentsCount }
  ] = await Promise.all([
    supabase.from('docs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('docs').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('doc_comments').select('*', { count: 'exact', head: true }).eq('approved', false)
  ]);

  // 2. Fetch Docs
  let query = supabase
    .from('docs')
    .select(`
      id, title, slug, content_type, status, published_at, reading_time_minutes, updated_at,
      doc_comments (id, approved)
    `)
    .order('updated_at', { ascending: false });

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }
  if (type && type !== 'all') {
    query = query.eq('content_type', type);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: docs } = await query;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      <DocsClient 
        docs={docs || []} 
        search={search || ''} 
        type={type || 'all'}
        status={status || 'all'}
        stats={{
          published: publishedCount || 0,
          drafts: draftCount || 0,
          pendingComments: pendingCommentsCount || 0
        }}
      />
    </div>
  );
}
