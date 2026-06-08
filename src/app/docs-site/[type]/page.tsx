import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { FileText, Layers, Box, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['article', 'project_doc', 'product_doc']

const TYPE_CONFIG = {
  article: {
    title: 'Articles',
    description: 'Insights and thought leadership on modern ops, automation, and engineering.',
    icon: FileText,
    color: 'text-blue-500'
  },
  project_doc: {
    title: 'Project Docs',
    description: 'Technical write-ups and architectural overviews of client pipelines we\'ve built.',
    icon: Layers,
    color: 'text-emerald-500'
  },
  product_doc: {
    title: 'Product Docs',
    description: 'Official documentation for Hisako\'s internal and external tools like VendoFlow.',
    icon: Box,
    color: 'text-purple-500'
  }
}

export default async function DocsTypePage({ params }: { params: Promise<{ type: string }> }) {
  const supabase = await createClient()
  const type = (await params).type

  if (!VALID_TYPES.includes(type)) {
    notFound()
  }

  const { data: articles } = await supabase
    .from('docs_articles')
    .select('*, profiles:created_by(full_name)')
    .eq('is_published', true)
    .eq('type', type)
    .order('published_at', { ascending: false })

  const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]
  const Icon = config.icon

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 space-y-12">
      <div className="space-y-4">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Link>
        <div className="flex items-center space-x-4">
          <Icon className={`h-12 w-12 ${config.color}`} />
          <h1 className="text-4xl font-extrabold tracking-tight">{config.title}</h1>
        </div>
        <p className="text-xl text-muted-foreground">{config.description}</p>
      </div>

      <div className="space-y-8">
        {articles?.map(doc => (
          <div key={doc.id} className="border-b pb-8 last:border-0 last:pb-0">
            <h2 className="text-2xl font-bold mb-2">
              <Link href={`/${type}/${doc.slug}`} className="hover:underline">
                {doc.title}
              </Link>
            </h2>
            <div className="text-sm text-muted-foreground flex items-center space-x-4">
              <span>{format(new Date(doc.published_at || doc.updated_at), 'MMMM d, yyyy')}</span>
              {doc.profiles && (
                <>
                  <span>•</span>
                  <span>{doc.profiles.full_name}</span>
                </>
              )}
            </div>
            <div className="mt-4 prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground line-clamp-3">
              {doc.content.replace(/[#*`>\[\]-]/g, '').substring(0, 300)}...
            </div>
            <div className="mt-4">
              <Link href={`/${type}/${doc.slug}`} className={`text-sm font-medium hover:underline ${config.color}`}>
                Read More →
              </Link>
            </div>
          </div>
        ))}
        {articles?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No documents found in this category.
          </div>
        )}
      </div>
    </div>
  )
}
