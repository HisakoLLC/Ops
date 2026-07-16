'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, Save, Eye, EyeOff, Plus, ExternalLink, History } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { MediaPicker } from '@/components/cms/MediaPicker'
import { useRole } from '@/lib/use-role'
import { RevisionHistoryPanel } from '@/components/cms/RevisionHistoryPanel'

interface DocEditorProps {
  initialDoc: any | null;
  products: any[];
  sections: any[];
  userProfile: any;
}

export function DocEditor({ initialDoc, products, sections, userProfile }: DocEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  const { canPublishDoc, canDeleteAnyDoc } = useRole()
  
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(initialDoc?.updated_at ? new Date(initialDoc.updated_at) : null)
  const [isPreview, setIsPreview] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState(initialDoc?.title || '')
  const [slug, setSlug] = useState(initialDoc?.slug || '')
  const [excerpt, setExcerpt] = useState(initialDoc?.excerpt || '')
  const [content, setContent] = useState(initialDoc?.content || '')
  const [contentType, setContentType] = useState(initialDoc?.content_type || 'article')
  const [status, setStatus] = useState(initialDoc?.status || 'draft')
  
  // Shared metadata
  const [coverImageUrl, setCoverImageUrl] = useState(initialDoc?.cover_image_url || '')
  const [tags, setTags] = useState<string[]>(initialDoc?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [categoryId, setCategoryId] = useState<string>(initialDoc?.category_id || '')
  const [categories, setCategories] = useState<any[]>([])
  const [seoTitle, setSeoTitle] = useState(initialDoc?.seo_title || '')
  const [seoDescription, setSeoDescription] = useState(initialDoc?.seo_description || '')

  useEffect(() => {
    supabase.from('doc_categories').select('*').order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setCategories(data) })
  }, [])

  // Article specific
  const [featured, setFeatured] = useState(initialDoc?.featured || false)
  const [authorOverride, setAuthorOverride] = useState(initialDoc?.author_name_override || '')

  // Project specific
  const [projectIndustry, setProjectIndustry] = useState(initialDoc?.project_industry || '')
  const [projectTools, setProjectTools] = useState<string[]>(initialDoc?.project_tools || [])
  const [projectOutcome, setProjectOutcome] = useState(initialDoc?.project_outcome || '')
  const [projectClient, setProjectClient] = useState(initialDoc?.project_client_name || '')
  const [projectAnonymous, setProjectAnonymous] = useState(initialDoc?.project_anonymous ?? true)

  // Product doc specific
  const [productId, setProductId] = useState(initialDoc?.product_id || '')
  const [sectionId, setSectionId] = useState(initialDoc?.section_id || '')
  const [sortOrder, setSortOrder] = useState(initialDoc?.sort_order?.toString() || '0')

  // Auto-generate slug from title if empty
  useEffect(() => {
    if (!initialDoc && title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
    }
  }, [title, initialDoc, slug])

  const handleSave = async (publishStatus?: string) => {
    setIsSaving(true)
    const currentStatus = publishStatus || status

    const payload: Record<string, any> = {
      title,
      slug,
      excerpt,
      content,
      content_type: contentType,
      status: currentStatus,
      category_id: categoryId || null,
      cover_image_url: coverImageUrl,
      tags,
      seo_title: seoTitle,
      seo_description: seoDescription,
      author_id: userProfile?.id,
      author_name_override: authorOverride,
      featured,
      project_industry: projectIndustry,
      project_tools: projectTools,
      project_outcome: projectOutcome,
      project_client_name: projectClient,
      project_anonymous: projectAnonymous,
      product_id: productId || null,
      section_id: sectionId || null,
      sort_order: parseInt(sortOrder) || 0,
      updated_by: userProfile?.id,
      published_at: currentStatus === 'published' && (!initialDoc || initialDoc.status !== 'published') ? new Date().toISOString() : initialDoc?.published_at
    }

    if (initialDoc?.id) {
      const { error } = await supabase.from('docs').update(payload).eq('id', initialDoc.id)
      if (error) {
        toast.error('Failed to save document')
      } else {
        setLastSaved(new Date())
        if (publishStatus) setStatus(publishStatus)
        toast.success(publishStatus === 'published' ? 'Published!' : 'Saved')
        router.refresh()
      }
    } else {
      payload.created_by = userProfile?.id
      const { data, error } = await supabase.from('docs').insert(payload).select().single()
      if (error) {
        toast.error('Failed to create document: ' + error.message)
      } else {
        toast.success('Document created')
        router.replace(`/docs/${data.id}/edit`)
      }
    }
    setIsSaving(false)
  }

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const before = content.substring(0, start)
    const after = content.substring(end)
    setContent(before + prefix + selected + suffix + after)
    // Focus back and move cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  const availableTools = ['n8n', 'Make', 'Claude', 'GPT-4o', 'Gemini', 'Python', 'Supabase', 'Other']

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Header */}
      <div className="flex h-14 items-center justify-between border-b px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/docs')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="text-sm text-muted-foreground">
            {lastSaved ? `Last saved: ${format(lastSaved, 'h:mm a')}` : 'Unsaved changes'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {initialDoc?.id && (
            <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)}>
              <History className="h-4 w-4 mr-2" /> History
            </Button>
          )}
          {status === 'published' && (
            <Button variant="outline" size="sm" onClick={() => window.open(`https://docs.hisako.eu`, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" /> View Live
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleSave('draft')} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          {canPublishDoc ? (
            <Button size="sm" className="bg-[#E8400C] hover:bg-[#c4360a] text-white" onClick={() => handleSave('published')} disabled={isSaving}>
              {status === 'published' ? 'Update Live' : 'Publish'}
            </Button>
          ) : (
            <Button size="sm" className="bg-[#E8400C] hover:bg-[#c4360a] text-white" onClick={() => handleSave('review')} disabled={isSaving}>
              Submit for Review
            </Button>
          )}
        </div>
      </div>

      {/* Main Split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel (65%) */}
        <div className="flex-[65] flex flex-col border-r overflow-y-auto">
          <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
            <div>
              <input
                type="text"
                placeholder="Untitled"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-muted"
              />
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground font-mono">
                docs.hisako.eu/{contentType === 'article' ? 'articles' : contentType === 'project' ? 'projects' : 'products'}/
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="bg-transparent outline-none flex-1 border-b border-transparent hover:border-zinc-300 focus:border-zinc-400"
                  placeholder="slug"
                />
              </div>
            </div>

            <div>
              <Textarea
                placeholder="Brief description shown in listings and search results..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="resize-none"
                rows={2}
                maxLength={200}
              />
              <div className="text-right text-xs text-muted-foreground mt-1">
                {excerpt.length}/200
              </div>
            </div>

            <div className="flex flex-col flex-1 border rounded-md overflow-hidden min-h-[500px]">
              <div className="flex items-center justify-between bg-muted/50 border-b px-2 py-1 shrink-0">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => insertMarkdown('# ', '')}>H1</Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => insertMarkdown('## ', '')}>H2</Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => insertMarkdown('### ', '')}>H3</Button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-bold" onClick={() => insertMarkdown('**', '**')}>B</Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs italic" onClick={() => insertMarkdown('_', '_')}>I</Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-mono" onClick={() => insertMarkdown('`', '`')}>{'<>'}</Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => insertMarkdown('[', '](url)')}>Link</Button>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsPreview(!isPreview)}>
                  {isPreview ? <><EyeOff className="h-3 w-3 mr-1" /> Edit</> : <><Eye className="h-3 w-3 mr-1" /> Preview</>}
                </Button>
              </div>
              
              {isPreview ? (
                <div className="p-6 prose prose-zinc dark:prose-invert max-w-none flex-1 overflow-y-auto">
                  {content ? (
                    <div>{/* Real implementation would use react-markdown here, simplifying for this phase */}
                      <p className="text-sm text-muted-foreground mb-4 italic">(Markdown Preview Active)</p>
                      <pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nothing to preview</p>
                  )}
                </div>
              ) : (
                <textarea
                  id="markdown-editor"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full p-6 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed"
                  placeholder="Start writing..."
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault()
                      insertMarkdown('  ')
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Metadata Panel (35%) */}
        <div className="flex-[35] bg-zinc-50 dark:bg-zinc-950 border-l overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Content Type */}
            <div className="space-y-3">
              <Label>Content Type</Label>
              <select 
                className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="article">Article (Blog Post)</option>
                <option value="project">Project Case Study</option>
                <option value="product_doc">Product Documentation</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Category</Label>
                <Link href="/cms/categories" target="_blank" className="text-xs text-[#E8400C] hover:underline">
                  + New Category
                </Link>
              </div>
              <select
                className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No Category</option>
                {categories.filter(c => !c.parent_id).map(root => (
                  <React.Fragment key={root.id}>
                    <option value={root.id} className="font-semibold">{root.name}</option>
                    {categories.filter(c => c.parent_id === root.id).map(child => (
                      <option key={child.id} value={child.id}>&nbsp;&nbsp;↳ {child.name}</option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Label>Status</Label>
              <select
                className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="review">Ready for Review</option>
                {canPublishDoc && <option value="published">Published</option>}
                {canPublishDoc && <option value="archived">Archived</option>}
              </select>
            </div>

            <div className="h-px bg-border w-full" />

            {/* Type Specific Fields */}
            {contentType === 'article' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Article Details</h3>
                <div className="space-y-2">
                  <Label>Cover Image URL</Label>
                  <div className="flex gap-2">
                    <Input value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                    <MediaPicker 
                      onSelect={(url) => setCoverImageUrl(url)}
                      trigger={<Button type="button" variant="outline" size="sm" className="shrink-0">Choose</Button>}
                    />
                  </div>
                  {coverImageUrl && (
                    <div className="relative mt-2 aspect-video w-full rounded overflow-hidden border bg-muted">
                      <img src={coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setCoverImageUrl('')} 
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-xs hover:bg-black/80"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))}>
                        {tag} &times;
                      </Badge>
                    ))}
                  </div>
                  <Input 
                    value={tagInput} 
                    onChange={e => setTagInput(e.target.value)} 
                    placeholder="Type tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim() && !tags.includes(tagInput.trim())) {
                        e.preventDefault()
                        setTags([...tags, tagInput.trim()])
                        setTagInput('')
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Featured Article</Label>
                  <Switch checked={featured} onCheckedChange={setFeatured} />
                </div>
                <div className="space-y-2">
                  <Label>Author Name Override</Label>
                  <Input value={authorOverride} onChange={e => setAuthorOverride(e.target.value)} placeholder="e.g. Guest Writer" />
                </div>
              </div>
            )}

            {contentType === 'project' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Project Details</h3>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input value={projectIndustry} onChange={e => setProjectIndustry(e.target.value)} placeholder="e.g. Retail, Healthcare" />
                </div>
                <div className="space-y-2">
                  <Label>Tools Used</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTools.map(tool => (
                      <Badge 
                        key={tool} 
                        variant={projectTools.includes(tool) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          if (projectTools.includes(tool)) setProjectTools(projectTools.filter(t => t !== tool))
                          else setProjectTools([...projectTools, tool])
                        }}
                      >
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Outcome Snippet</Label>
                  <Textarea value={projectOutcome} onChange={e => setProjectOutcome(e.target.value)} rows={2} placeholder="e.g. Saved 40 hours per week..." />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Anonymous Client</Label>
                  <Switch checked={projectAnonymous} onCheckedChange={setProjectAnonymous} />
                </div>
                {!projectAnonymous && (
                  <div className="space-y-2">
                    <Label>Client Name</Label>
                    <Input value={projectClient} onChange={e => setProjectClient(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {contentType === 'product_doc' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Product Doc Details</h3>
                <div className="space-y-2">
                  <Label>Product</Label>
                  <select 
                    className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    <option value="">Select Product...</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <select 
                    className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                  >
                    <option value="">No Section (Root)</option>
                    {sections.filter((s: any) => s.product_id === productId).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
                </div>
              </div>
            )}

            <div className="h-px bg-border w-full" />

            {/* SEO Panel */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">SEO Options</h3>
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={title || 'Page Title'} />
              </div>
              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder={excerpt || 'Page description...'} rows={2} />
              </div>
              {/* Google Preview */}
              <div className="bg-white dark:bg-zinc-900 p-3 rounded border shadow-sm">
                <div className="text-xs text-zinc-500 mb-1">docs.hisako.eu &gt; ...</div>
                <div className="text-blue-600 dark:text-blue-400 text-sm hover:underline cursor-pointer">{seoTitle || title || 'Untitled'} - Hisako Docs</div>
                <div className="text-zinc-600 dark:text-zinc-400 text-xs mt-1 line-clamp-2">{seoDescription || excerpt || 'No description provided.'}</div>
              </div>
            </div>

            {initialDoc?.id && (
              <>
                <div className="h-px bg-border w-full" />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Comments</h3>
                    <Link href={`/docs/${initialDoc.id}/comments`} className="text-xs text-[#E8400C] hover:underline">Manage Comments →</Link>
                  </div>
                  <p className="text-sm text-muted-foreground">Manage public comments for this document.</p>
                </div>
              </>
            )}

            {initialDoc?.id && (canDeleteAnyDoc || (initialDoc?.author_id === userProfile?.id && status === 'draft')) && (
              <>
                <div className="h-px bg-border w-full" />
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to permanently delete this document?')) return;
                      const { error } = await supabase.from('docs').delete().eq('id', initialDoc.id);
                      if (error) {
                        toast.error('Failed to delete: ' + error.message);
                      } else {
                        toast.success('Document deleted');
                        router.push('/docs');
                      }
                    }}
                  >
                    Delete Document
                  </Button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      <RevisionHistoryPanel
        docId={initialDoc?.id || null}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestored={(doc) => {
          setTitle(doc.title)
          setContent(doc.content)
          setExcerpt(doc.excerpt || '')
          setSlug(doc.slug || '')
          setStatus(doc.status || 'draft')
          if (doc.category_id !== undefined) setCategoryId(doc.category_id || '')
          toast.success('Editor state updated to restored revision')
        }}
      />
    </div>
  )
}
