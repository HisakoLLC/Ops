import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { PublicComments } from '@/components/docs/PublicComments'
import { FeedbackForm } from '@/components/docs-site/FeedbackForm'

export const dynamic = 'force-dynamic'

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params

  const { data: article } = await supabase
    .from('docs')
    .select('*, profiles(full_name, avatar_url)')
    .eq('slug', slug)
    .eq('content_type', 'article')
    .eq('status', 'published')
    .single()

  if (!article) notFound()

  const { data: comments } = await supabase
    .from('doc_comments')
    .select('*')
    .eq('doc_id', article.id)
    .eq('approved', true)
    .order('created_at', { ascending: true })

  const authorName = article.author_name_override || article.profiles?.full_name || 'Hisako Team'

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12">
        <Link href="/articles" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Articles
        </Link>
        
        {article.cover_image_url && (
          <div className="aspect-[21/9] w-full mb-8 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <img 
              src={article.cover_image_url} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
          {article.title}
        </h1>
        
        <div className="flex items-center text-sm text-muted-foreground gap-3 border-b pb-8">
          <div className="flex items-center gap-2">
            {article.profiles?.avatar_url ? (
              <img src={article.profiles.avatar_url} alt={authorName} className="w-6 h-6 rounded-full bg-zinc-200" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            )}
            <span className="font-medium text-foreground">{authorName}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span>{article.published_at ? format(new Date(article.published_at), 'MMM d, yyyy') : ''}</span>
          {article.reading_time_minutes && (
            <>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span>{article.reading_time_minutes} min read</span>
            </>
          )}
        </div>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none prose-pre:bg-[#1A1A1A] prose-pre:text-zinc-100 prose-a:text-[#E8400C] prose-a:no-underline hover:prose-a:underline">
        {/* Simple rendering for now, can be replaced by ReactMarkdown later */}
        <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 text-foreground">
          {article.content}
        </pre>
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2 pt-8 border-t">
          {article.tags.map((tag: string) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-12">
        <FeedbackForm docTitle={article.title} docUrl={`https://docs.hisako.eu/articles/${article.slug}`} />
      </div>

      <PublicComments docId={article.id} initialComments={comments || []} />
    </article>
  )
}
