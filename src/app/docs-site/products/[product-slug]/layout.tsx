import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Book } from 'lucide-react'

export default async function ProductLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ 'product-slug': string }>
}) {
  const supabase = await createClient()
  const { 'product-slug': productSlug } = await params

  const { data: product } = await supabase
    .from('doc_products')
    .select('*')
    .eq('slug', productSlug)
    .single()

  if (!product) notFound()

  // Fetch sections
  const { data: sections } = await supabase
    .from('doc_sections')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true })

  // Fetch docs for this product
  const { data: docs } = await supabase
    .from('docs')
    .select('id, title, slug, section_id, sort_order')
    .eq('content_type', 'product_doc')
    .eq('product_id', product.id)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="sticky top-24 space-y-6">
          <div>
            <Link href="/products" className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="mr-1 h-3 w-3" /> All Products
            </Link>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Book className="h-5 w-5 text-[#E8400C]" />
              {product.name}
            </h2>
            {product.version && (
              <div className="text-xs text-muted-foreground mt-1">Version {product.version}</div>
            )}
          </div>

          <nav className="space-y-6">
            {/* Docs without a section */}
            {docs?.filter(d => !d.section_id).length ? (
              <div className="space-y-2">
                {docs.filter(d => !d.section_id).map(doc => (
                  <Link 
                    key={doc.id} 
                    href={`/products/${productSlug}/${doc.slug}`}
                    className="block text-sm text-muted-foreground hover:text-foreground hover:underline py-1"
                  >
                    {doc.title}
                  </Link>
                ))}
              </div>
            ) : null}

            {/* Sections */}
            {sections?.map(section => {
              const sectionDocs = docs?.filter(d => d.section_id === section.id)
              if (!sectionDocs?.length) return null
              return (
                <div key={section.id} className="space-y-2">
                  <h3 className="font-semibold text-sm tracking-tight">{section.name}</h3>
                  <div className="flex flex-col border-l border-zinc-200 dark:border-zinc-800 ml-1 pl-3 space-y-2">
                    {sectionDocs.map(doc => (
                      <Link 
                        key={doc.id} 
                        href={`/products/${productSlug}/${doc.slug}`}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {doc.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 pb-24">
        {children}
      </div>
    </div>
  )
}
