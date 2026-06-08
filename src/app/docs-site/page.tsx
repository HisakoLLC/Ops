import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Layers, Box } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DocsSiteLanding() {
  const supabase = await createClient()

  // Fetch recent published articles of each type
  const fetchRecent = async (type: string) => {
    const { data } = await supabase
      .from('docs_articles')
      .select('title, slug')
      .eq('is_published', true)
      .eq('type', type)
      .order('published_at', { ascending: false })
      .limit(3)
    return data || []
  }

  const articles = await fetchRecent('article')
  const projectDocs = await fetchRecent('project_doc')
  const productDocs = await fetchRecent('product_doc')

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 md:py-24 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Documentation & Insights</h1>
        <p className="text-xl text-muted-foreground">
          Explore our thought leadership articles, deep-dives into client projects, and comprehensive product documentation.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="h-10 w-10 text-blue-500 mb-4" />
            <CardTitle className="text-2xl"><Link href="/article" className="hover:underline">Articles</Link></CardTitle>
            <CardDescription>Insights and thought leadership on modern ops, automation, and engineering.</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6 space-y-3">
            {articles.map(doc => (
              <div key={doc.slug}>
                <Link href={`/article/${doc.slug}`} className="text-sm font-medium hover:text-blue-500 transition-colors">
                  {doc.title}
                </Link>
              </div>
            ))}
            {articles.length === 0 && <p className="text-sm text-muted-foreground">No articles published yet.</p>}
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Layers className="h-10 w-10 text-emerald-500 mb-4" />
            <CardTitle className="text-2xl"><Link href="/project_doc" className="hover:underline">Project Docs</Link></CardTitle>
            <CardDescription>Technical write-ups and architectural overviews of client pipelines we&apos;ve built.</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6 space-y-3">
            {projectDocs.map(doc => (
              <div key={doc.slug}>
                <Link href={`/project_doc/${doc.slug}`} className="text-sm font-medium hover:text-emerald-500 transition-colors">
                  {doc.title}
                </Link>
              </div>
            ))}
            {projectDocs.length === 0 && <p className="text-sm text-muted-foreground">No project docs published yet.</p>}
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Box className="h-10 w-10 text-purple-500 mb-4" />
            <CardTitle className="text-2xl"><Link href="/product_doc" className="hover:underline">Product Docs</Link></CardTitle>
            <CardDescription>Official documentation for Hisako&apos;s internal and external tools like VendoFlow.</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6 space-y-3">
            {productDocs.map(doc => (
              <div key={doc.slug}>
                <Link href={`/product_doc/${doc.slug}`} className="text-sm font-medium hover:text-purple-500 transition-colors">
                  {doc.title}
                </Link>
              </div>
            ))}
            {productDocs.length === 0 && <p className="text-sm text-muted-foreground">No product docs published yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
