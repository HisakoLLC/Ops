'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, FolderOpen, Image as ImageIcon } from 'lucide-react'
import { MediaPicker } from '@/components/cms/MediaPicker'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  parent_id: string | null
  cover_image_url: string
  sort_order: number
  created_at: string
}

export default function CategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [docCounts, setDocCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Sheet state
  const [isOpen, setIsOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const { data: catData, error: catErr } = await supabase
      .from('doc_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (catErr) {
      toast.error('Failed to load categories: ' + catErr.message)
    } else {
      setCategories(catData || [])
    }

    // Load doc counts
    const { data: docs } = await supabase
      .from('docs')
      .select('category_id')
    if (docs) {
      const counts: Record<string, number> = {}
      docs.forEach(d => {
        if (d.category_id) {
          counts[d.category_id] = (counts[d.category_id] || 0) + 1
        }
      })
      setDocCounts(counts)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingCat(null)
    setName('')
    setSlug('')
    setDescription('')
    setParentId('')
    setCoverImageUrl('')
    setSortOrder((categories.length + 1).toString())
    setIsOpen(true)
  }

  const handleOpenEdit = (cat: Category) => {
    setEditingCat(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description || '')
    setParentId(cat.parent_id || '')
    setCoverImageUrl(cat.cover_image_url || '')
    setSortOrder(cat.sort_order.toString())
    setIsOpen(true)
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingCat && !slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required')
      return
    }

    setIsSaving(true)
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      parent_id: parentId || null,
      cover_image_url: coverImageUrl,
      sort_order: parseInt(sortOrder) || 0,
    }

    if (editingCat) {
      const { error } = await supabase
        .from('doc_categories')
        .update(payload)
        .eq('id', editingCat.id)
      if (error) {
        toast.error('Failed to update category: ' + error.message)
      } else {
        toast.success('Category updated')
        setIsOpen(false)
        loadData()
      }
    } else {
      const { error } = await supabase
        .from('doc_categories')
        .insert(payload)
      if (error) {
        toast.error('Failed to create category: ' + error.message)
      } else {
        toast.success('Category created')
        setIsOpen(false)
        loadData()
      }
    }
    setIsSaving(false)
  }

  const handleDelete = async (id: string, catName: string) => {
    const count = docCounts[id] || 0
    const msg = count > 0 
      ? `Category "${catName}" currently has ${count} assigned document(s). If deleted, their category will be set to unassigned. Proceed?`
      : `Are you sure you want to delete "${catName}"?`
    
    if (!confirm(msg)) return

    const { error } = await supabase.from('doc_categories').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete: ' + error.message)
    } else {
      toast.success('Category deleted')
      loadData()
    }
  }

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const current = categories[index]
    const target = categories[targetIndex]

    // Swap orders
    await Promise.all([
      supabase.from('doc_categories').update({ sort_order: target.sort_order }).eq('id', current.id),
      supabase.from('doc_categories').update({ sort_order: current.sort_order }).eq('id', target.id)
    ])

    loadData()
  }

  // Organize roots and children for table
  const roots = categories.filter(c => !c.parent_id)
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentation Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your technical docs, case studies, and guides into hierarchies.</p>
        </div>
        <Button className="bg-[#E8400C] hover:bg-[#c4360a] text-white" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Category
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 w-16">Order</th>
              <th className="px-4 py-3">Category Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-center">Docs Count</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">Loading categories...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No categories found. Click &quot;New Category&quot; to create your first one.
                </td>
              </tr>
            ) : (
              roots.map((root, idx) => {
                const children = getChildren(root.id)
                return (
                  <React.Fragment key={root.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => handleMoveOrder(idx, 'up')}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === roots.length - 1} onClick={() => handleMoveOrder(idx, 'down')}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2.5">
                        {root.cover_image_url && (
                          <img src={root.cover_image_url} alt="" className="h-6 w-6 rounded object-cover border" />
                        )}
                        <span>{root.name}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">/{root.slug}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-md truncate">{root.description || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800">
                          {docCounts[root.id] || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(root)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(root.id, root.name)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {children.map((child) => (
                      <tr key={child.id} className="hover:bg-muted/30 transition-colors bg-muted/10">
                        <td className="px-4 py-2.5"></td>
                        <td className="px-4 py-2.5 pl-10 flex items-center gap-2 text-sm text-foreground/90">
                          <span className="text-muted-foreground/60">↳</span>
                          {child.cover_image_url && (
                            <img src={child.cover_image_url} alt="" className="h-5 w-5 rounded object-cover border" />
                          )}
                          <span>{child.name}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">/{child.slug}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-md truncate">{child.description || '—'}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800">
                            {docCounts[child.id] || 0}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(child)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(child.id, child.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out Sheet for Create/Edit */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingCat ? 'Edit Category' : 'Create New Category'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4 py-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Name</label>
              <Input
                required
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. AI Automation"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Slug</label>
              <Input
                required
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="e.g. ai-automation"
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Parent Category (Optional)</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={parentId}
                onChange={e => setParentId(e.target.value)}
              >
                <option value="">No Parent (Root Category)</option>
                {categories
                  .filter(c => c.id !== editingCat?.id && !c.parent_id)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Description</label>
              <Textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief summary of what documents belong in this category..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Cover Image URL</label>
              <div className="flex gap-2">
                <Input value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                <MediaPicker
                  onSelect={url => setCoverImageUrl(url)}
                  trigger={<Button type="button" variant="outline" size="sm" className="shrink-0"><ImageIcon className="h-4 w-4" /></Button>}
                />
              </div>
              {coverImageUrl && (
                <div className="relative mt-2 h-24 w-full rounded overflow-hidden border bg-muted flex items-center justify-center">
                  <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Sort Order</label>
              <Input
                type="number"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#E8400C] hover:bg-[#c4360a] text-white" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
