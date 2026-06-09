import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function ArticlesPage() {
  const supabase = await createClient()

  const { data: articles } = await supabase
    .from('docs')
    .select('title, slug, excerpt, cover_image_url, published_at, reading_time_minutes')
    .eq('content_type', 'article')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
        </Link>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Articles</h1>
        <p className="text-lg text-muted-foreground">
          Thoughts, insights, and deep-dives from the Hisako team.
        </p>
      </div>

      <div className="space-y-12">
        {articles?.map((article) => (
          <article key={article.slug} className="group">
            <Link href={`/articles/${article.slug}`} className="block">
              {article.cover_image_url && (
                <div className="aspect-[21/9] w-full mb-6 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
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
              <p className="text-muted-foreground mb-4">
                {article.excerpt}
              </p>
              <div className="flex items-center text-sm text-muted-foreground gap-3">
                <span>{article.published_at ? format(new Date(article.published_at), 'MMM d, yyyy') : ''}</span>
                {article.reading_time_minutes && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span>{article.reading_time_minutes} min read</span>
                  </>
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
