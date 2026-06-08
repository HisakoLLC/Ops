import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['article', 'project_doc', 'product_doc']

export default async function DocViewPage({ params }: { params: Promise<{ type: string, slug: string }> }) {
  const supabase = await createClient()
  const { type, slug } = await params

  if (!VALID_TYPES.includes(type)) {
    notFound()
  }

  const { data: doc } = await supabase
    .from('docs_articles')
    .select('*, profiles!docs_articles_created_by_fkey(full_name, avatar_url)')
    .eq('is_published', true)
    .eq('type', type)
    .eq('slug', slug)
    .single()

  if (!doc) {
    notFound()
  }

  return (
    <article className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 space-y-6">
        <Link href={`/${type}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to {type.replace('_', ' ')}s
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-6 mb-4">{doc.title}</h1>
        
        <div className="flex items-center space-x-4 text-muted-foreground border-b pb-8">
          <div className="flex items-center">
            {doc.profiles?.avatar_url ? (
              <img src={doc.profiles.avatar_url} alt={doc.profiles.full_name || 'Author'} className="h-6 w-6 rounded-full mr-2 object-cover border" />
            ) : (
              <User className="h-4 w-4 mr-2" />
            )}
            {doc.profiles?.full_name || 'Anonymous'}
          </div>
          <div>•</div>
          <div>{format(new Date(doc.published_at || doc.updated_at), 'MMMM d, yyyy')}</div>
        </div>
      </div>

      <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {doc.content}
        </ReactMarkdown>
      </div>
    </article>
  )
}
