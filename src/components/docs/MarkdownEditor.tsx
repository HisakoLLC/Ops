'use client'

import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, Video, Code, List, Heading1, Heading2, Loader2, ListOrdered, Quote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MediaPicker } from '@/components/cms/MediaPicker'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)

    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('docs-media')
      .upload(filePath, file)

    setIsUploading(false)

    if (uploadError) {
      toast.error('Failed to upload file')
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('docs-media')
      .getPublicUrl(filePath)

    if (type === 'image') {
      insertText(`![${file.name}](${publicUrl})`)
    } else {
      // For video, we can use an HTML5 video tag since markdown doesn't natively support video
      insertText(`\n<video controls width="100%">\n  <source src="${publicUrl}" type="video/mp4">\n  Your browser does not support the video tag.\n</video>\n`)
    }
  }

  return (
    <div className="border rounded-md overflow-hidden bg-background flex flex-col h-full min-h-[500px]">
      <Tabs defaultValue="write" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30">
          <TabsList className="h-9">
            <TabsTrigger value="write" className="text-xs px-3">Write</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs px-3">Preview</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('**', '**')} title="Bold">
              <Bold className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('*', '*')} title="Italic">
              <Italic className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('# ')} title="Heading 1">
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('## ')} title="Heading 2">
              <Heading2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('- ')} title="Bullet List">
              <List className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('1. ')} title="Numbered List">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('> ')} title="Quote">
              <Quote className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('`', '`')} title="Inline Code">
              <Code className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('[', '](url)')} title="Link">
              <LinkIcon className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            
            <MediaPicker 
              onSelect={(url, altText) => insertText(`![${altText || 'image'}](${url})`)}
              trigger={
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600 dark:text-orange-400" title="Choose from Media Library">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              }
            />
            <div className="relative">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={isUploading} title="Upload Image">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              </Button>
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={(e) => handleFileUpload(e, 'image')}
                title="Upload Image"
              />
            </div>
            <div className="relative">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={isUploading} title="Upload Video">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              </Button>
              <input 
                type="file" 
                accept="video/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={(e) => handleFileUpload(e, 'video')}
                title="Upload Video"
              />
            </div>
          </div>
        </div>

        <TabsContent value="write" className="flex-1 m-0">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full min-h-[500px] p-4 resize-none focus:outline-none bg-transparent font-mono text-sm leading-relaxed"
            placeholder="Write your document content here in Markdown format..."
          />
        </TabsContent>
        <TabsContent value="preview" className="flex-1 m-0 bg-background overflow-auto">
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none p-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || '*Nothing to preview*'}
            </ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
