import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Layers } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('doc_products')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
        </Link>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Products</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Official documentation for Hisako&apos;s tools, frameworks, and client products.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-all flex flex-col h-full border-zinc-200 dark:border-zinc-800 group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 group-hover:bg-[#E8400C]/10 transition-colors">
                  <Layers className="h-6 w-6 text-zinc-600 dark:text-zinc-400 group-hover:text-[#E8400C] transition-colors" />
                </div>
                {product.version && (
                  <span className="text-xs font-mono text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    v{product.version}
                  </span>
                )}
              </div>
              <CardTitle className="text-2xl group-hover:text-[#E8400C] transition-colors">{product.name}</CardTitle>
              <CardDescription className="line-clamp-3 mt-2 text-base">{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
              <Link 
                href={`/products/${product.slug}`}
                className="inline-flex items-center text-sm font-medium text-[#E8400C] hover:text-[#c4360a]"
              >
                Explore Docs <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </CardContent>
          </Card>
        ))}
        {(!products || products.length === 0) && (
          <p className="text-muted-foreground col-span-full">No products documented yet.</p>
        )}
      </div>
    </div>
  )
}
