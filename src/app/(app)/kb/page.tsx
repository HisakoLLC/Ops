import { createClient } from "@/lib/supabase/server";
import { KBHomeClient } from "./kb-home-client";

export const dynamic = "force-dynamic";

export default async function KBHomePage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const supabase = await createClient();
  const search = (await searchParams).search;

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user?.id).single();
  const isAdmin = profile?.role === 'admin';

  let query = supabase
    .from('kb_articles')
    .select('*, kb_categories(name, icon), profiles:created_by(full_name, avatar_url)')
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  let { data: articles } = await query;

  if (!articles || articles.length === 0) {
    const { count } = await supabase.from('kb_articles').select('*', { count: 'exact', head: true });
    if (count === 0 && isAdmin) {
      // Seed starter articles
      const { data: cats } = await supabase.from('kb_categories').select('id, name');
      const getCatId = (name: string) => cats?.find(c => c.name === name)?.id;
      
      const seedArticles = [
        { title: 'Discovery Call Playbook', slug: 'discovery-call-playbook', category_id: getCatId('Client Process'), content: '## Discovery Call Framework\n\n1. **Rapport** (5 mins)\n2. **Current State** (10 mins)\n3. **Desired State** (5 mins)\n4. **Our Solution** (5 mins)\n5. **Next Steps** (5 mins)', created_by: userData.user?.id },
        { title: 'Proposal Writing Guide', slug: 'proposal-writing-guide', category_id: getCatId('Document Guides'), content: '## Proposal Writing Guide\n\nAlways include:\n- Executive Summary\n- Scope of Work\n- Pricing & Options\n- Timeline', created_by: userData.user?.id },
        { title: 'Pipeline Build Checklist', slug: 'pipeline-build-checklist', category_id: getCatId('Pipeline SOPs'), content: '## Pipeline Build Checklist\n\n- [ ] Requirements gathering\n- [ ] Architecture design\n- [ ] Development\n- [ ] Testing\n- [ ] Go-live', created_by: userData.user?.id },
        { title: 'Client Handover Process', slug: 'client-handover-process', category_id: getCatId('Client Process'), content: '## Client Handover Process\n\nWalk the client through the final deliverables and ensure they have all necessary access credentials.', created_by: userData.user?.id },
        { title: 'Monthly Reporting Guide', slug: 'monthly-reporting-guide', category_id: getCatId('Document Guides'), content: '## Monthly Reporting Guide\n\nReport on:\n1. Leads generated\n2. Pipeline conversions\n3. Automation efficiency gains', created_by: userData.user?.id }
      ].filter(a => a.category_id);

      if (seedArticles.length > 0) {
        await supabase.from('kb_articles').insert(seedArticles);
        // Re-fetch
        const { data: newArticles } = await query;
        articles = newArticles;
      }
    }
  }
  
  const { count: catCount } = await supabase.from('kb_categories').select('*', { count: 'exact', head: true });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <KBHomeClient 
        articles={articles || []} 
        search={search || ''} 
        stats={{ articles: articles?.length || 0, categories: catCount || 0 }} 
        isAdmin={isAdmin} 
      />
    </div>
  );
}
