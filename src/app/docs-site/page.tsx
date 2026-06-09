import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { ArrowRight, BookOpen, Layers, Monitor, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DocsSiteLanding() {
  const supabase = await createClient()

  // 1. Featured Articles
  const { data: featuredArticles } = await supabase
    .from('docs')
    .select('title, slug, excerpt, cover_image_url, published_at, reading_time_minutes, content_type')
    .eq('content_type', 'article')
    .eq('featured', true)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3)

  // 2. Recent Articles
  const { data: recentArticles } = await supabase
    .from('docs')
    .select('title, slug, published_at, content_type')
    .eq('content_type', 'article')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6)

  // 3. Projects Row
  const { data: projects } = await supabase
    .from('docs')
    .select('title, slug, project_industry, project_tools, project_outcome')
    .eq('content_type', 'project')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(4)

  // 4. Products Section
  const { data: products } = await supabase
    .from('doc_products')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO */}
      <section className="bg-zinc-50 dark:bg-zinc-900/20 border-b">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:py-24 flex flex-col justify-center min-h-[280px]">
          <div className="font-mono text-xs font-bold text-muted-foreground tracking-wider mb-6">
            [ HISAKO DOCS ]
          </div>
          <h1 className="text-4xl md:text-[44px] font-bold tracking-tight text-foreground mb-4 max-w-3xl leading-tight">
            Documentation, Articles & Projects
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Insights on AI automation, technical write-ups, and product documentation from the Hisako team.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-4 py-16 space-y-24 w-full">
        {/* FEATURED ARTICLES */}
        {featuredArticles && featuredArticles.length > 0 && (
          <section>
            <div className="flex items-center justify-between border-b pb-4 mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Featured</h2>
            </div>
            <div className="flex overflow-x-auto pb-6 -mx-4 px-4 snap-x gap-6">
              {featuredArticles.map((article) => (
                <Link 
                  key={article.slug} 
                  href={`/articles/${article.slug}`}
                  className="snap-start shrink-0 w-[320px] md:w-[350px] group block rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md overflow-hidden"
                >
                  <div className="aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                    {article.cover_image_url ? (
                      <img src={article.cover_image_url} alt={article.title} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900" />
                    )}
                    <div className="absolute top-3 left-3 px-2 py-0.5 text-[10px] uppercase font-bold bg-white/90 text-zinc-800 rounded shadow-sm backdrop-blur">
                      Article
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg leading-snug mb-2 group-hover:text-[#E8400C] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground gap-3">
                      <span>{article.published_at ? format(new Date(article.published_at), 'MMM d, yyyy') : ''}</span>
                      {article.reading_time_minutes && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                          <span>{article.reading_time_minutes} min read</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* RECENT ARTICLES */}
        <section>
          <div className="flex items-end justify-between border-b pb-4 mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Latest Articles</h2>
            <Link href="/articles" className="text-sm font-medium text-[#E8400C] hover:text-[#c4360a] flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {recentArticles?.map((article) => (
              <Link 
                key={article.slug} 
                href={`/articles/${article.slug}`}
                className="group flex flex-col justify-between p-5 rounded-lg border bg-card hover:border-[#E8400C]/50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-[#E8400C] transition-colors mb-2">
                    {article.title}
                  </h3>
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  {article.published_at ? format(new Date(article.published_at), 'MMM d, yyyy') : ''}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* PROJECTS ROW */}
        <section>
          <div className="flex items-end justify-between border-b pb-4 mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Project Write-ups</h2>
            <Link href="/projects" className="text-sm font-medium text-[#E8400C] hover:text-[#c4360a] flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects?.map((project) => (
              <Link 
                key={project.slug} 
                href={`/projects/${project.slug}`}
                className="group flex flex-col h-full rounded-lg border bg-card p-5 hover:border-[#E8400C]/50 transition-colors"
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.project_industry && (
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 rounded">
                      {project.project_industry}
                    </span>
                  )}
                  {project.project_tools && project.project_tools.slice(0, 2).map((tool: string) => (
                    <span key={tool} className="px-2 py-0.5 text-[10px] uppercase font-bold bg-zinc-50 text-zinc-500 dark:bg-zinc-900 border rounded">
                      {tool}
                    </span>
                  ))}
                </div>
                <h3 className="font-semibold text-base group-hover:text-[#E8400C] transition-colors mb-3">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mt-auto">
                  {project.project_outcome}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section>
          <div className="flex items-end justify-between border-b pb-4 mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Product Docs</h2>
            <Link href="/products" className="text-sm font-medium text-[#E8400C] hover:text-[#c4360a] flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products?.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-all flex flex-col h-full border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                      <Layers className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    {product.version && (
                      <span className="text-xs font-mono text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                        v{product.version}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2">{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                  <Link 
                    href={`/products/${product.slug}`}
                    className="inline-flex items-center text-sm font-medium text-[#E8400C] hover:text-[#c4360a]"
                  >
                    View Documentation <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
