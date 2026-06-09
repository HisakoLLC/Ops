import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Box, Building2, Wrench } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params

  const { data: project } = await supabase
    .from('docs')
    .select('*')
    .eq('slug', slug)
    .eq('content_type', 'project')
    .eq('status', 'published')
    .single()

  if (!project) notFound()

  return (
    <article className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-12 border-b pb-12">
        <Link href="/projects" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight max-w-3xl">
          {project.title}
        </h1>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Building2 className="w-4 h-4" /> Industry
            </div>
            <div className="font-semibold">{project.project_industry || 'N/A'}</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Box className="w-4 h-4" /> Client
            </div>
            <div className="font-semibold">
              {project.project_anonymous ? 'Confidential' : project.project_client_name || 'N/A'}
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Wrench className="w-4 h-4" /> Core Stack
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {project.project_tools && project.project_tools.length > 0 ? (
                project.project_tools.map((tool: string) => (
                  <span key={tool} className="text-xs font-semibold px-2 py-0.5 bg-white dark:bg-zinc-800 border rounded">
                    {tool}
                  </span>
                ))
              ) : (
                <span className="font-semibold">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none prose-pre:bg-[#1A1A1A] prose-pre:text-zinc-100 prose-a:text-[#E8400C] prose-a:no-underline hover:prose-a:underline prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-16 prose-h2:border-b prose-h2:pb-4">
        {/* Abstract / Outcome */}
        <div className="lead text-xl text-muted-foreground font-medium mb-12">
          {project.project_outcome}
        </div>

        {/* Markdown rendering */}
        <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 text-foreground">
          {project.content}
        </pre>
      </div>
    </article>
  )
}
