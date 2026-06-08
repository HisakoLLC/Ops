import { createClient } from "@/lib/supabase/server";
import { DocsClient } from "./docs-client";

export const dynamic = "force-dynamic";

export default async function DocsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const supabase = await createClient();
  const search = (await searchParams).search;

  let query = supabase
    .from('docs_articles')
    .select('*, profiles:created_by(full_name, avatar_url)')
    .order('updated_at', { ascending: false });

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data: articles } = await query;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      <DocsClient articles={articles || []} search={search || ''} />
    </div>
  );
}
