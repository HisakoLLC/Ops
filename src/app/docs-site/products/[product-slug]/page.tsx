import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProductIndexPage({ params }: { params: Promise<{ 'product-slug': string }> }) {
  const supabase = await createClient()
  const { 'product-slug': productSlug } = await params

  const { data: product } = await supabase
    .from('doc_products')
    .select('*')
    .eq('slug', productSlug)
    .single()

  if (!product) notFound()

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <h1>{product.name} Documentation</h1>
      <p className="lead">{product.description}</p>
      
      <div className="not-prose mt-8 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Select a topic from the sidebar to begin exploring the documentation for {product.name}.
        </p>
      </div>
    </div>
  )
}
