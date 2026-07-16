'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, Search, Trash2, Tags as TagsIcon, Edit2, Check, X } from 'lucide-react'
import { format } from 'date-fns'

interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export default function TagsPage() {
  const supabase = createClient()
  const [tags, setTags] = useState<Tag[]>([])
  const [docCounts, setDocCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Inline create state
  const [newTagName, setNewTagName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const loadTags = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('doc_tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      toast.error('Failed to load tags: ' + error.message)
    } else {
      setTags(data || [])
    }

    // Fetch doc tag counts
    const { data: docs } = await supabase.from('docs').select('tags')
    if (docs) {
      const counts: Record<string, number> = {}
      docs.forEach(d => {
        if (d.tags && Array.isArray(d.tags)) {
          d.tags.forEach(t => {
            counts[t] = (counts[t] || 0) + 1
          })
        }
      })
      setDocCounts(counts)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTags()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return

    setIsCreating(true)
    const name = newTagName.trim()
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    const { error } = await supabase.from('doc_tags').insert({ name, slug })
    if (error) {
      toast.error('Failed to create tag: ' + error.message)
    } else {
      toast.success('Tag created')
      setNewTagName('')
      loadTags()
    }
    setIsCreating(false)
  }

  const handleSaveEdit = async (tag: Tag) => {
    if (!editName.trim() || editName.trim() === tag.name) {
      setEditingId(null)
      return
    }

    const newName = editName.trim()
    const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    // Update doc_tags table
    const { error: tagErr } = await supabase
      .from('doc_tags')
      .update({ name: newName, slug: newSlug })
      .eq('id', tag.id)

    if (tagErr) {
      toast.error('Failed to rename tag: ' + tagErr.message)
      return
    }

    // Also update all docs containing this tag
    const { data: docsWithTag } = await supabase
      .from('docs')
      .select('id, tags')
      .contains('tags', [tag.name])

    if (docsWithTag && docsWithTag.length > 0) {
      for (const d of docsWithTag) {
        const updatedTags = (d.tags || []).map((t: string) => t === tag.name ? newName : t)
        await supabase.from('docs').update({ tags: updatedTags }).eq('id', d.id)
      }
    }

    toast.success('Tag renamed successfully')
    setEditingId(null)
    loadTags()
  }

  const handleDelete = async (tag: Tag) => {
    const count = docCounts[tag.name] || 0
    if (!confirm(`Are you sure you want to delete tag "${tag.name}"? It is currently used in ${count} document(s).`)) return

    // Remove from doc_tags
    await supabase.from('doc_tags').delete().eq('id', tag.id)

    // Remove from all docs containing this tag
    const { data: docsWithTag } = await supabase
      .from('docs')
      .select('id, tags')
      .contains('tags', [tag.name])

    if (docsWithTag && docsWithTag.length > 0) {
      for (const d of docsWithTag) {
        const updatedTags = (d.tags || []).filter((t: string) => t !== tag.name)
        await supabase.from('docs').update({ tags: updatedTags }).eq('id', d.id)
      }
    }

    toast.success('Tag deleted')
    setTags(tags.filter(t => t.id !== tag.id))
  }

  const filteredTags = search.trim()
    ? tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase()))
    : tags

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tag Manager</h1>
          <p className="text-sm text-muted-foreground">Centralized tag registry automatically synced whenever tags are added to documents.</p>
        </div>

        <form onSubmit={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="New tag name..."
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            className="w-full sm:w-48 h-9 text-sm"
          />
          <Button type="submit" size="sm" className="bg-[#E8400C] hover:bg-[#c4360a] text-white" disabled={isCreating || !newTagName.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add Tag
          </Button>
        </form>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tags by name or slug..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Tag Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-center">Docs Count</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">Loading tags...</td>
              </tr>
            ) : filteredTags.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  <TagsIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No tags found matching your query.
                </td>
              </tr>
            ) : (
              filteredTags.map(tag => (
                <tr key={tag.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {editingId === tag.id ? (
                      <div className="flex items-center gap-1.5 max-w-xs">
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="h-7 text-xs"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleSaveEdit(tag)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span>{tag.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">/{tag.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800">
                      {docCounts[tag.name] || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {format(new Date(tag.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId !== tag.id && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingId(tag.id)
                            setEditName(tag.name)
                          }}
                          title="Rename Tag"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(tag)}
                          title="Delete Tag"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
