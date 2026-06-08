'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, FileText, Globe, Lock, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
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

export function DocsClient({ articles, search }: { articles: any[], search: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get('q')?.toString()
    if (q) {
      router.push(`/docs?search=${encodeURIComponent(q)}`)
    } else {
      router.push('/docs')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    setIsDeleting(id)
    const { error } = await supabase.from('docs_articles').delete().eq('id', id)
    setIsDeleting(null)
    if (error) {
      toast.error('Failed to delete document')
    } else {
      toast.success('Document deleted')
      router.refresh()
    }
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'article': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'project_doc': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      case 'product_doc': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Public Docs</h1>
          <p className="text-muted-foreground mt-1">Manage content published to docs.hisako.eu</p>
        </div>
        <Button onClick={() => router.push('/docs/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <form onSubmit={handleSearch} className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              name="q"
              placeholder="Search documents..." 
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 border-b bg-muted/50 p-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Last Updated</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            {articles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No documents found.</p>
              </div>
            ) : (
              <div className="divide-y">
                {articles.map((doc) => (
                  <div key={doc.id} className="grid grid-cols-12 items-center p-4 text-sm hover:bg-muted/50 transition-colors">
                    <div className="col-span-5 font-medium">
                      {doc.title}
                      <div className="text-xs text-muted-foreground font-normal mt-0.5 truncate pr-4">
                        /{doc.slug}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="secondary" className={`capitalize ${getTypeColor(doc.type)}`}>
                        {doc.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      {doc.is_published ? (
                        <><Globe className="h-3.5 w-3.5 text-green-500" /> <span className="text-green-600 dark:text-green-400">Published</span></>
                      ) : (
                        <><Lock className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-muted-foreground">Draft</span></>
                      )}
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {format(new Date(doc.updated_at), 'MMM d, yyyy')}
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
