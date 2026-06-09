'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, Search, FileText, Globe, MoreHorizontal, Edit, Trash2,
  CheckCircle2, Pencil, MessageSquare, ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

interface DocsClientProps {
  docs: any[];
  search: string;
  type: string;
  status: string;
  stats: {
    published: number;
    drafts: number;
    pendingComments: number;
  };
}

export function DocsClient({ docs, search, type, status, stats }: DocsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/docs?${params.toString()}`);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    setIsDeleting(id)
    const { error } = await supabase.from('docs').delete().eq('id', id)
    setIsDeleting(null)
    if (error) {
      toast.error('Failed to delete document')
    } else {
      toast.success('Document deleted')
      router.refresh()
    }
  }

  const getTypeLabel = (t: string) => {
    switch(t) {
      case 'article': return 'Article';
      case 'project': return 'Project';
      case 'product_doc': return 'Product Doc';
      default: return t;
    }
  }

  const getDocUrl = (doc: any) => {
    const base = 'https://docs.hisako.eu';
    switch(doc.content_type) {
      case 'article': return `${base}/articles/${doc.slug}`;
      case 'project': return `${base}/projects/${doc.slug}`;
      case 'product_doc': return `${base}/products/product/${doc.slug}`; // Note: actual product slug needs join, fallback for now
      default: return base;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Docs</h1>
          <p className="text-muted-foreground mt-1">Manage content published to docs.hisako.eu</p>
        </div>
        <Button onClick={() => router.push('/docs/new')} className="bg-[#E8400C] hover:bg-[#c4360a] text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Doc
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Pencil className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.drafts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments pending</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingComments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search documents..." 
                defaultValue={search}
                onChange={(e) => {
                  const val = e.target.value;
                  const timeout = setTimeout(() => handleFilterChange('search', val), 500);
                  return () => clearTimeout(timeout);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="article">Articles</option>
                <option value="project">Projects</option>
                <option value="product_doc">Product Docs</option>
              </select>
              <select 
                className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 border-b bg-muted/50 p-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">Title</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Published</div>
              <div className="col-span-1 text-center">Reading</div>
              <div className="col-span-1 text-center">Comments</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            {docs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No documents found.</p>
              </div>
            ) : (
              <div className="divide-y">
                {docs.map((doc) => (
                  <div key={doc.id} className="grid grid-cols-12 items-center p-4 text-sm hover:bg-muted/50 transition-colors">
                    <div className="col-span-4 font-medium">
                      <Link href={`/docs/${doc.id}/edit`} className="hover:text-[#E8400C] transition-colors">
                        {doc.title}
                      </Link>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="secondary" className="capitalize bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                        {getTypeLabel(doc.content_type)}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      {doc.status === 'published' ? (
                        <div className="inline-flex px-2 py-0.5 rounded border border-green-200 text-green-700 bg-green-50 text-[10px] uppercase font-bold">Published</div>
                      ) : doc.status === 'archived' ? (
                        <div className="inline-flex px-2 py-0.5 rounded border border-zinc-200 text-zinc-400 bg-zinc-50 text-[10px] uppercase font-bold">Archived</div>
                      ) : (
                        <div className="inline-flex px-2 py-0.5 rounded border border-zinc-200 text-zinc-500 bg-zinc-50 text-[10px] uppercase font-bold">Draft</div>
                      )}
                    </div>
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {doc.published_at ? format(new Date(doc.published_at), 'MMM d, yyyy') : 'Draft'}
                    </div>
                    <div className="col-span-1 text-center text-muted-foreground text-xs">
                      {doc.reading_time_minutes ? `${doc.reading_time_minutes}m` : '-'}
                    </div>
                    <div className="col-span-1 text-center">
                      {doc.doc_comments?.length > 0 ? (
                        <Link href={`/docs/${doc.id}/comments`} className="text-[#E8400C] hover:underline">
                          {doc.doc_comments.length}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 disabled:opacity-50 disabled:pointer-events-none" disabled={isDeleting === doc.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/docs/${doc.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {doc.status === 'published' && (
                            <DropdownMenuItem onClick={() => window.open(getDocUrl(doc), '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" /> View Live
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDelete(doc.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
