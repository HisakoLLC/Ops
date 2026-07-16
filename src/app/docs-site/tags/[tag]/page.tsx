import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Tag as TagIcon } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function TagListingPage({ params }: { params: Promise<{ tag: string }> }) {
  const supabase = await createClient()
  const { tag: rawTag } = await params
  const tagSlug = rawTag.toLowerCase()

  // Find actual tag name from doc_tags or fallback to formatted string
  const { data: tagData } = await supabase
    .from('doc_tags')
    .select('name')
    .eq('slug', tagSlug)
    .single()

  const tagName = tagData?.name || tagSlug.replace(/-/g, ' ')

  // Fetch published articles with this tag (ilike match or array contains)
  const { data: allArticles } = await supabase
    .from('docs')
    .select('title, slug, excerpt, cover_image_url, published_at, reading_time_minutes, tags')
    .eq('content_type', 'article')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const articles = allArticles?.filter(a => 
    a.tags && a.tags.some((t: string) => 
      t.toLowerCase() === tagName.toLowerCase() || 
      t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') === tagSlug
    )
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-10">
        <Link href="/articles" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> All Articles
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-[#E8400C]/10 text-[#E8400C]">
            <TagIcon className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">#{tagName}</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Showing all articles and guides tagged with &quot;{tagName}&quot;.
        </p>
      </div>

      <div className="space-y-10">
        {articles?.map((article) => (
          <article key={article.slug} className="group border-b pb-8 last:border-0">
            <Link href={`/articles/${article.slug}`} className="block">
              {article.cover_image_url && (
                <div className="aspect-[21/9] w-full mb-5 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 border">
                  <img
                    src={article.cover_image_url}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold group-hover:text-[#E8400C] transition-colors mb-2">
                {article.title}
              </h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>{article.published_at ? format(new Date(article.published_at), 'MMM d, yyyy') : ''}</span>
                  {article.reading_time_minutes && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      <span>{article.reading_time_minutes} min read</span>
                    </>
                  )}
                </div>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                    {article.tags.map((t: string) => (
                      <span
                        key={t}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          t.toLowerCase() === tagName.toLowerCase() ? 'bg-[#E8400C]/15 text-[#E8400C] font-semibold' : 'bg-muted'
                        }`}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </article>
        ))}
        {(!articles || articles.length === 0) && (
          <div className="text-center py-16 border rounded-lg bg-muted/20">
            <TagIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-muted-foreground">No published articles found with this tag.</p>
          </div>
        )}
      </div>
    </div>
  )
}
