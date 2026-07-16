import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, FolderOpen } from 'lucide-react'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CategoryListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params

  // 1. Fetch category
  const { data: category } = await supabase
    .from('doc_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) notFound()

  // 2. Fetch all child category IDs (if parent)
  const { data: children } = await supabase
    .from('doc_categories')
    .select('id, name, slug')
    .eq('parent_id', category.id)

  const catIds = [category.id, ...(children?.map(c => c.id) || [])]

  // 3. Fetch published articles belonging to category or children
  const { data: articles } = await supabase
    .from('docs')
    .select('title, slug, excerpt, cover_image_url, published_at, reading_time_minutes, tags')
    .in('category_id', catIds)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-10">
        <Link href="/articles" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> All Articles
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-[#E8400C]/10 text-[#E8400C]">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-lg text-muted-foreground">{category.description}</p>
        )}

        {children && children.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase mr-1">Subcategories:</span>
            {children.map(child => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="px-3 py-1 rounded-full bg-muted/60 text-xs font-medium hover:bg-[#E8400C]/15 hover:text-[#E8400C] transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
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
                    {article.tags.slice(0, 3).map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/tags/${tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`}
                        className="px-2 py-0.5 rounded bg-muted text-[11px] hover:text-[#E8400C]"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </article>
        ))}
        {(!articles || articles.length === 0) && (
          <div className="text-center py-16 border rounded-lg bg-muted/20">
            <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-muted-foreground">No published articles in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
