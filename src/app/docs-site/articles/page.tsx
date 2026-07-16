import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function ArticlesPage() {
  const supabase = await createClient()

  const [
    { data: articles },
    { data: categories }
  ] = await Promise.all([
    supabase
      .from('docs')
      .select('title, slug, excerpt, cover_image_url, published_at, reading_time_minutes, tags, category_id')
      .eq('content_type', 'article')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase
      .from('doc_categories')
      .select('id, name, slug')
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-10">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
        </Link>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Articles</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Thoughts, insights, and deep-dives from the Hisako team.
        </p>

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <span className="text-xs font-semibold text-muted-foreground uppercase self-center mr-2">Categories:</span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="px-3.5 py-1 rounded-full bg-muted/70 text-xs font-medium hover:bg-[#E8400C]/15 hover:text-[#E8400C] transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-12">
        {articles?.map((article) => (
          <article key={article.slug} className="group border-b pb-10 last:border-0">
            <Link href={`/articles/${article.slug}`} className="block">
              {article.cover_image_url && (
                <div className="aspect-[21/9] w-full mb-6 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 border">
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
                    {article.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-muted/80 text-[11px]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </article>
        ))}
        {(!articles || articles.length === 0) && (
          <p className="text-muted-foreground">No articles published yet.</p>
        )}
      </div>
    </div>
  )
}
