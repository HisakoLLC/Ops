import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { PublicComments } from '@/components/docs/PublicComments'

export const dynamic = 'force-dynamic'

export default async function ProductDocPage({ params }: { params: Promise<{ 'product-slug': string, 'doc-slug': string }> }) {
  const supabase = await createClient()
  const { 'doc-slug': docSlug } = await params

  const { data: doc } = await supabase
    .from('docs')
    .select('*, profiles(full_name)')
    .eq('slug', docSlug)
    .eq('content_type', 'product_doc')
    .eq('status', 'published')
    .single()

  if (!doc) notFound()

  const { data: comments } = await supabase
    .from('doc_comments')
    .select('*')
    .eq('doc_id', doc.id)
    .eq('approved', true)
    .order('created_at', { ascending: true })

  return (
    <article className="max-w-3xl">
      <div className="mb-10 pb-8 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {doc.title}
        </h1>
        <div className="flex items-center text-sm text-muted-foreground gap-3">
          <span>{doc.published_at ? format(new Date(doc.published_at), 'MMM d, yyyy') : ''}</span>
          {doc.reading_time_minutes && (
            <>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span>{doc.reading_time_minutes} min read</span>
            </>
          )}
        </div>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none prose-pre:bg-[#1A1A1A] prose-pre:text-zinc-100 prose-a:text-[#E8400C] prose-a:no-underline hover:prose-a:underline">
        <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 text-foreground">
          {doc.content}
        </pre>
      </div>

      <PublicComments docId={doc.id} initialComments={comments || []} />
    </article>
  )
}
