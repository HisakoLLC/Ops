'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewDocPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const slug = formData.get('slug') as string
    const type = formData.get('type') as string

    if (!title || !slug || !type) {
      toast.error('Please fill in all fields')
      setIsLoading(false)
      return
    }

    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('docs_articles')
      .insert({
        title,
        slug,
        type,
        created_by: userData.user?.id,
        updated_by: userData.user?.id,
      })
      .select()
      .single()

    setIsLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to create document')
    } else if (data) {
      toast.success('Document created')
      router.push(`/docs/${data.id}/edit`)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Document</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>Set up the basic information for your new public document.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="e.g. Getting Started with VendoFlow" 
                onChange={(e) => {
                  const slugInput = document.getElementById('slug') as HTMLInputElement
                  if (slugInput && !slugInput.value) {
                    slugInput.value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" name="slug" placeholder="e.g. getting-started-vendoflow" />
              <p className="text-xs text-muted-foreground">This will be the URL: docs.hisako.eu/[type]/<strong>[slug]</strong></p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <Select name="type" defaultValue="article">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article (Blog-style)</SelectItem>
                  <SelectItem value="project_doc">Project Documentation</SelectItem>
                  <SelectItem value="product_doc">Product Docs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create & Continue to Editor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
