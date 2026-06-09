import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('docs')
    .select('title, slug, project_industry, project_tools, project_outcome, project_client_name, project_anonymous, published_at')
    .eq('content_type', 'project')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-12">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
        </Link>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Projects</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Deep dives into custom AI automations and client architectures built by Hisako.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        {projects?.map((project) => (
          <Link 
            key={project.slug} 
            href={`/projects/${project.slug}`}
            className="group flex flex-col h-full rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-[#E8400C]/50"
          >
            <div className="flex flex-wrap gap-2 mb-6">
              {project.project_industry && (
                <span className="px-2.5 py-1 text-[11px] uppercase font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700/50">
                  {project.project_industry}
                </span>
              )}
              {project.project_tools && project.project_tools.slice(0, 3).map((tool: string) => (
                <span key={tool} className="px-2.5 py-1 text-[11px] uppercase font-bold bg-white text-zinc-600 dark:bg-zinc-900 border rounded">
                  {tool}
                </span>
              ))}
            </div>
            
            <h2 className="text-xl font-bold group-hover:text-[#E8400C] transition-colors mb-4 leading-snug">
              {project.title}
            </h2>
            
            <p className="text-muted-foreground line-clamp-3 mt-auto mb-6">
              {project.project_outcome}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-4 border-t">
              <span className="flex items-center">
                Client: {project.project_anonymous ? 'Confidential' : project.project_client_name}
              </span>
              <span>{project.published_at ? format(new Date(project.published_at), 'MMM yyyy') : ''}</span>
            </div>
          </Link>
        ))}
        
        {(!projects || projects.length === 0) && (
          <p className="text-muted-foreground col-span-2">No projects published yet.</p>
        )}
      </div>
    </div>
  )
}
