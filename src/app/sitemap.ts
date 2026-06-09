import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = 'https://docs.hisako.eu'

  // Static routes
  const routes = [
    '',
    '/articles',
    '/projects',
    '/products',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Fetch all published docs
  const { data: docs } = await supabase
    .from('docs')
    .select('slug, content_type, updated_at, product_id, doc_products(slug)')
    .eq('status', 'published')

  const dynamicRoutes = (docs || []).map((doc) => {
    let url = baseUrl
    if (doc.content_type === 'article') {
      url += `/articles/${doc.slug}`
    } else if (doc.content_type === 'project') {
      url += `/projects/${doc.slug}`
    } else if (doc.content_type === 'product_doc') {
      const docsProducts = doc.doc_products as any
      const productSlug = Array.isArray(docsProducts) ? docsProducts[0]?.slug : docsProducts?.slug
      // If we don't have a product slug, we fallback to a safe path or skip
      url += `/products/${productSlug || 'unknown'}/${doc.slug}`
    }

    return {
      url,
      lastModified: doc.updated_at ? new Date(doc.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  })

  // Fetch products
  const { data: products } = await supabase
    .from('doc_products')
    .select('slug, updated_at')

  const productRoutes = (products || []).map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...routes, ...dynamicRoutes, ...productRoutes]
}
