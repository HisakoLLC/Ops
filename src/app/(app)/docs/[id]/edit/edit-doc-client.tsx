'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2, Globe, Lock } from 'lucide-react'
import { MarkdownEditor } from '@/components/docs/MarkdownEditor'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function EditDocClient({ doc }: { doc: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  
  const [title, setTitle] = useState(doc.title)
  const [content, setContent] = useState(doc.content || '')
  const [isPublished, setIsPublished] = useState(doc.is_published)

  const handleSave = async () => {
    setIsLoading(true)
    
    const updates = {
      title,
      content,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
      ...(isPublished && !doc.is_published ? { published_at: new Date().toISOString() } : {})
    }

    const { error } = await supabase
      .from('docs_articles')
      .update(updates)
      .eq('id', doc.id)

    setIsLoading(false)

    if (error) {
      toast.error('Failed to save document')
    } else {
      toast.success('Document saved successfully')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4 flex-1 w-full max-w-2xl">
          <Button variant="ghost" size="icon" onClick={() => router.push('/docs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold border-transparent px-2 h-auto focus-visible:ring-1 bg-transparent"
            />
            <div className="flex items-center gap-2 px-2 mt-1">
              <Badge variant="secondary" className="capitalize text-xs">
                {doc.type.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">/{doc.slug}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id="publish" 
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="publish" className="flex items-center gap-1.5 cursor-pointer">
              {isPublished ? (
                <><Globe className="h-3.5 w-3.5 text-green-500" /> <span className="text-sm">Published</span></>
              ) : (
                <><Lock className="h-3.5 w-3.5 text-muted-foreground" /> <span className="text-sm">Draft</span></>
              )}
            </Label>
          </div>

          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <MarkdownEditor value={content} onChange={setContent} />
      </div>
    </div>
  )
}
