'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, FolderTree, ExternalLink, Copy, Check } from 'lucide-react'

interface NavMenu {
  id: string
  name: string
  slug: string
  description: string
}

interface NavItem {
  id: string
  menu_id: string
  parent_id: string | null
  label: string
  href: string
  target: string
  icon_name: string
  is_button: boolean
  sort_order: number
}

export default function NavigationEditorPage() {
  const supabase = createClient()
  const [menus, setMenus] = useState<NavMenu[]>([])
  const [selectedMenu, setSelectedMenu] = useState<NavMenu | null>(null)
  const [items, setItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Sheet state
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NavItem | null>(null)
  const [label, setLabel] = useState('')
  const [href, setHref] = useState('#')
  const [parentId, setParentId] = useState('')
  const [target, setTarget] = useState('_self')
  const [iconName, setIconName] = useState('')
  const [isButton, setIsButton] = useState(false)
  const [sortOrder, setSortOrder] = useState('1')
  const [isSaving, setIsSaving] = useState(false)

  const loadMenus = async () => {
    setLoading(true)
    const { data: menuData, error: menuErr } = await supabase
      .from('nav_menus')
      .select('*')
      .order('slug', { ascending: true })

    if (menuErr) {
      toast.error('Failed to load menus: ' + menuErr.message)
    } else if (menuData && menuData.length > 0) {
      setMenus(menuData)
      if (!selectedMenu) {
        setSelectedMenu(menuData[0])
      }
    }
    setLoading(false)
  }

  const loadItems = async (menuId: string) => {
    const { data, error } = await supabase
      .from('nav_items')
      .select('*')
      .eq('menu_id', menuId)
      .order('sort_order', { ascending: true })

    if (error) {
      toast.error('Failed to load menu items: ' + error.message)
    } else {
      setItems(data || [])
    }
  }

  useEffect(() => {
    loadMenus()
  }, [])

  useEffect(() => {
    if (selectedMenu) {
      loadItems(selectedMenu.id)
    }
  }, [selectedMenu])

  const handleOpenCreate = () => {
    if (!selectedMenu) return
    setEditingItem(null)
    setLabel('')
    setHref('/')
    setParentId('')
    setTarget('_self')
    setIconName('')
    setIsButton(false)
    setSortOrder((items.length + 1).toString())
    setIsOpen(true)
  }

  const handleOpenEdit = (item: NavItem) => {
    setEditingItem(item)
    setLabel(item.label)
    setHref(item.href)
    setParentId(item.parent_id || '')
    setTarget(item.target || '_self')
    setIconName(item.icon_name || '')
    setIsButton(item.is_button || false)
    setSortOrder(item.sort_order.toString())
    setIsOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMenu || !label.trim() || !href.trim()) {
      toast.error('Label and link address are required')
      return
    }

    setIsSaving(true)
    const payload = {
      menu_id: selectedMenu.id,
      label: label.trim(),
      href: href.trim(),
      parent_id: parentId || null,
      target,
      icon_name: iconName.trim(),
      is_button: isButton,
      sort_order: parseInt(sortOrder) || 1,
    }

    if (editingItem) {
      const { error } = await supabase
        .from('nav_items')
        .update(payload)
        .eq('id', editingItem.id)
      if (error) {
        toast.error('Failed to update item: ' + error.message)
      } else {
        toast.success('Navigation item updated')
        setIsOpen(false)
        loadItems(selectedMenu.id)
      }
    } else {
      const { error } = await supabase
        .from('nav_items')
        .insert(payload)
      if (error) {
        toast.error('Failed to add item: ' + error.message)
      } else {
        toast.success('Navigation item added')
        setIsOpen(false)
        loadItems(selectedMenu.id)
      }
    }
    setIsSaving(false)
  }

  const handleDelete = async (item: NavItem) => {
    if (!confirm(`Delete navigation item "${item.label}"? If it has child items, they will also be deleted.`)) return

    const { error } = await supabase.from('nav_items').delete().eq('id', item.id)
    if (error) {
      toast.error('Failed to delete: ' + error.message)
    } else if (selectedMenu) {
      toast.success('Item deleted')
      loadItems(selectedMenu.id)
    }
  }

  const handleMoveOrder = async (index: number, direction: 'up' | 'down', list: NavItem[]) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return

    const current = list[index]
    const targetItem = list[targetIndex]

    await Promise.all([
      supabase.from('nav_items').update({ sort_order: targetItem.sort_order }).eq('id', current.id),
      supabase.from('nav_items').update({ sort_order: current.sort_order }).eq('id', targetItem.id)
    ])

    if (selectedMenu) loadItems(selectedMenu.id)
  }

  const roots = items.filter(i => !i.parent_id)
  const getChildren = (pid: string) => items.filter(i => i.parent_id === pid)

  const copyApiUrl = () => {
    if (!selectedMenu) return
    const url = `${window.location.origin}/api/cms/navigation/${selectedMenu.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('API endpoint copied to clipboard')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Navigation Editor</h1>
          <p className="text-sm text-muted-foreground">Manage headers, footers, and sidebar link structures across Hisako web properties.</p>
        </div>
        <Button className="bg-[#E8400C] hover:bg-[#c4360a] text-white" onClick={handleOpenCreate} disabled={!selectedMenu}>
          <Plus className="h-4 w-4 mr-2" /> Add Link Item
        </Button>
      </div>

      {/* Menu Switcher Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/40 p-3 rounded-lg border">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase mr-2 pl-1">Menu:</span>
          {menus.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMenu(m)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedMenu?.id === m.id
                  ? 'bg-[#E8400C] text-white shadow-sm'
                  : 'bg-background hover:bg-muted text-foreground'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {selectedMenu && (
          <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded text-xs text-muted-foreground">
            <span className="font-mono truncate max-w-xs">/api/cms/navigation/{selectedMenu.slug}</span>
            <button onClick={copyApiUrl} className="hover:text-foreground p-1 transition-colors" title="Copy API Endpoint">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <a href={`/api/cms/navigation/${selectedMenu.slug}`} target="_blank" rel="noreferrer" className="hover:text-foreground p-1" title="View JSON">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>

      {selectedMenu?.description && (
        <p className="text-xs text-muted-foreground pl-1 italic">{selectedMenu.description}</p>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 w-16">Order</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Destination URL (`href`)</th>
              <th className="px-4 py-3 text-center">Target</th>
              <th className="px-4 py-3 text-center">Style</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">Loading navigation items...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No links configured for this menu yet. Click &quot;Add Link Item&quot; above.
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
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => handleMoveOrder(idx, 'up', roots)}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === roots.length - 1} onClick={() => handleMoveOrder(idx, 'down', roots)}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                        <span>{root.label}</span>
                        {root.icon_name && <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">icon:{root.icon_name}</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-sm truncate">{root.href}</td>
                      <td className="px-4 py-3 text-center text-xs font-mono">{root.target}</td>
                      <td className="px-4 py-3 text-center">
                        {root.is_button ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8400C]/15 text-[#E8400C]">CTA BUTTON</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Link</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(root)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(root)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {children.map((child, cIdx) => (
                      <tr key={child.id} className="hover:bg-muted/30 transition-colors bg-muted/10">
                        <td className="px-4 py-2.5 pl-6">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-5 w-5" disabled={cIdx === 0} onClick={() => handleMoveOrder(cIdx, 'up', children)}>
                              <ArrowUp className="h-2.5 w-2.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5" disabled={cIdx === children.length - 1} onClick={() => handleMoveOrder(cIdx, 'down', children)}>
                              <ArrowDown className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 pl-10 flex items-center gap-2 text-sm text-foreground/90">
                          <span className="text-muted-foreground/60">↳</span>
                          <span>{child.label}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground max-w-sm truncate">{child.href}</td>
                        <td className="px-4 py-2.5 text-center text-xs font-mono">{child.target}</td>
                        <td className="px-4 py-2.5 text-center">
                          {child.is_button ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8400C]/15 text-[#E8400C]">CTA BUTTON</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Link</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(child)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(child)}>
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
            <SheetTitle>{editingItem ? 'Edit Navigation Link' : 'Add Navigation Link'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4 py-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Label</label>
              <Input
                required
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Solutions or Documentation"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Destination (`href`)</label>
              <Input
                required
                value={href}
                onChange={e => setHref(e.target.value)}
                placeholder="/#solutions or https://docs.hisako.eu"
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Parent Item (Optional Hierarchy)</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={parentId}
                onChange={e => setParentId(e.target.value)}
              >
                <option value="">Top-Level Item (No Parent)</option>
                {items
                  .filter(i => i.id !== editingItem?.id && !i.parent_id)
                  .map(i => (
                    <option key={i.id} value={i.id}>{i.label}</option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Open In</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm font-mono"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                >
                  <option value="_self">Same Tab (`_self`)</option>
                  <option value="_blank">New Tab (`_blank`)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Sort Order</label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Icon Name (Optional Lucide Icon)</label>
              <Input
                value={iconName}
                onChange={e => setIconName(e.target.value)}
                placeholder="e.g. BookOpen, ArrowRight, Shield"
                className="font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/20">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Render as Button / CTA</label>
                <p className="text-xs text-muted-foreground">Highlight with primary brand button styling instead of plain link text.</p>
              </div>
              <Switch checked={isButton} onCheckedChange={setIsButton} />
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#E8400C] hover:bg-[#c4360a] text-white" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
