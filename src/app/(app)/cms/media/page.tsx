'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Upload, Search, Copy, Trash2, Grid, List as ListIcon, Image as ImageIcon, Folder, Check, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface MediaItem {
  id: string
  filename: string
  original_filename: string
  storage_path: string
  public_url: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  alt_text: string
  folder: string
  uploaded_by: string | null
  created_at: string
}

export default function MediaLibraryPage() {
  const supabase = createClient()
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [folderFilter, setFolderFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  
  // Upload State
  const [showUploadZone, setShowUploadZone] = useState(false)
  const [uploadFolder, setUploadFolder] = useState('general')
  const [uploadQueue, setUploadQueue] = useState<{ file: File; progress: number; status: 'uploading' | 'done' | 'error' }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMedia = async () => {
    setLoading(true)
    let q = supabase.from('media').select('*')
    
    if (folderFilter !== 'all') {
      q = q.eq('folder', folderFilter)
    }
    
    if (sortBy === 'newest') q = q.order('created_at', { ascending: false })
    if (sortBy === 'oldest') q = q.order('created_at', { ascending: true })
    if (sortBy === 'name') q = q.order('filename', { ascending: true })
    if (sortBy === 'size') q = q.order('size_bytes', { ascending: false })

    const { data, error } = await q
    if (error) {
      toast.error('Failed to load media: ' + error.message)
    } else {
      let filtered = (data || []) as MediaItem[]
      if (search.trim()) {
        const s = search.toLowerCase()
        filtered = filtered.filter(m => 
          m.filename.toLowerCase().includes(s) || 
          (m.alt_text && m.alt_text.toLowerCase().includes(s))
        )
      }
      setMedia(filtered)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMedia()
  }, [folderFilter, sortBy, search])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleCopyUrl = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(url)
    toast.success('Public URL copied to clipboard')
  }

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm('Are you sure you want to delete this file permanently?')) return

    const res = await fetch(`/api/cms/media/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('File deleted')
      setMedia(media.filter(m => m.id !== id))
      if (selectedMedia?.id === id) setSelectedMedia(null)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to delete file')
    }
  }

  const handleUpdateMeta = async (id: string, updates: { alt_text?: string; folder?: string }) => {
    const res = await fetch(`/api/cms/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const { media: updated } = await res.json()
      setMedia(media.map(m => m.id === id ? updated : m))
      setSelectedMedia(updated)
      toast.success('Details updated')
    } else {
      toast.error('Failed to update details')
    }
  }

  const handleFilesChosen = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    
    const newQueue = fileArray.map(f => ({ file: f, progress: 0, status: 'uploading' as const }))
    setUploadQueue(prev => [...prev, ...newQueue])

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', uploadFolder)

      try {
        const res = await fetch('/api/cms/media/upload', {
          method: 'POST',
          body: formData,
        })
        if (res.ok) {
          setUploadQueue(prev => prev.map(item => item.file === file ? { ...item, progress: 100, status: 'done' } : item))
        } else {
          setUploadQueue(prev => prev.map(item => item.file === file ? { ...item, status: 'error' } : item))
        }
      } catch {
        setUploadQueue(prev => prev.map(item => item.file === file ? { ...item, status: 'error' } : item))
      }
    }

    toast.success('Upload process completed')
    loadMedia()
  }

  const folders = ['general', 'blog', 'projects', 'products', 'logos', 'team', 'og-images']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground">Manage centralized images and assets for Hisako web properties.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium"
            value={uploadFolder}
            onChange={e => setUploadFolder(e.target.value)}
          >
            {folders.map(f => (
              <option key={f} value={f}>Folder: {f}</option>
            ))}
          </select>
          <Button
            className="bg-[#E8400C] hover:bg-[#c4360a] text-white"
            onClick={() => setShowUploadZone(!showUploadZone)}
          >
            <Upload className="h-4 w-4 mr-2" /> Upload Images
          </Button>
        </div>
      </div>

      {/* Collapsible Upload Zone */}
      {showUploadZone && (
        <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center bg-muted/20 transition-all">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={e => handleFilesChosen(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              <Upload className="h-6 w-6 text-[#E8400C]" />
            </div>
            <p className="font-medium text-sm">Drop images here or click to browse</p>
            <p className="text-xs text-muted-foreground">Accepts: jpg, png, webp, gif, svg. Max 10MB per file.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
              Select Files ({uploadFolder})
            </Button>
          </div>

          {/* Upload Queue */}
          {uploadQueue.length > 0 && (
            <div className="mt-6 space-y-2 text-left max-w-lg mx-auto border-t pt-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Upload Queue</h4>
              {uploadQueue.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-background p-2 rounded border text-xs">
                  <span className="truncate max-w-[240px] font-mono">{item.file.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{formatSize(item.file.size)}</span>
                    {item.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin text-orange-500" />}
                    {item.status === 'done' && <Check className="h-3 w-3 text-green-500" />}
                    {item.status === 'error' && <X className="h-3 w-3 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toolbar Row */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search filenames or alt text..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={folderFilter}
            onChange={e => setFolderFilter(e.target.value)}
          >
            <option value="all">All Folders</option>
            {folders.map(f => (
              <option key={f} value={f} className="capitalize">{f}</option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="name">Sort: Name</option>
            <option value="size">Sort: Size</option>
          </select>

          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-zinc-200 dark:bg-zinc-800 text-foreground' : 'text-muted-foreground'}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-zinc-200 dark:bg-zinc-800 text-foreground' : 'text-muted-foreground'}`}
              title="List View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold text-base">No media yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Upload images to get started building your library.</p>
          <Button onClick={() => setShowUploadZone(true)}>Upload your first image</Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {media.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedMedia(item)}
              className={`group border rounded-lg overflow-hidden bg-background flex flex-col cursor-pointer transition-all ${
                selectedMedia?.id === item.id ? 'ring-2 ring-[#E8400C] border-transparent' : 'hover:border-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              <div className="aspect-square bg-muted/30 relative overflow-hidden flex items-center justify-center">
                <img
                  src={item.public_url}
                  alt={item.alt_text || item.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => handleCopyUrl(item.public_url, e)}
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => handleDelete(item.id, e)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-2.5 text-xs flex flex-col gap-0.5 border-t bg-card">
                <span className="font-mono truncate font-medium text-foreground" title={item.filename}>
                  {item.filename}
                </span>
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>{item.width && item.height ? `${item.width} × ${item.height}` : item.mime_type.split('/')[1].toUpperCase()}</span>
                  <span>{formatSize(item.size_bytes)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 w-12">Preview</th>
                <th className="px-4 py-3">Filename</th>
                <th className="px-4 py-3">Folder</th>
                <th className="px-4 py-3">Dimensions</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Alt Text</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {media.map(item => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2">
                    <div className="h-10 w-10 rounded overflow-hidden bg-muted flex items-center justify-center">
                      <img src={item.public_url} alt={item.alt_text} className="h-full w-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs font-medium">{item.filename}</td>
                  <td className="px-4 py-2 capitalize text-xs text-muted-foreground">{item.folder}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {item.width && item.height ? `${item.width} × ${item.height}` : '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{formatSize(item.size_bytes)}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[150px]">
                    {item.alt_text || '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyUrl(item.public_url)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-out MediaDetailPanel */}
      <Sheet open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <SheetContent className="w-full sm:max-w-md flex flex-col overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Media Details</SheetTitle>
          </SheetHeader>
          {selectedMedia && (
            <div className="space-y-6 py-4 flex-1">
              <div className="aspect-video bg-black/90 rounded-lg overflow-hidden flex items-center justify-center p-2 border">
                <img src={selectedMedia.public_url} alt={selectedMedia.alt_text} className="max-h-60 max-w-full object-contain" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Alt Text</label>
                  <Input
                    className="mt-1"
                    defaultValue={selectedMedia.alt_text}
                    onBlur={e => {
                      if (e.target.value !== selectedMedia.alt_text) {
                        handleUpdateMeta(selectedMedia.id, { alt_text: e.target.value })
                      }
                    }}
                    placeholder="Describe image for SEO and accessibility"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Auto-saves on blur</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Folder</label>
                  <select
                    className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm capitalize"
                    value={selectedMedia.folder}
                    onChange={e => handleUpdateMeta(selectedMedia.id, { folder: e.target.value })}
                  >
                    {folders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 border-t pt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original File:</span>
                    <span className="font-mono">{selectedMedia.original_filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{selectedMedia.mime_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{formatSize(selectedMedia.size_bytes)}</span>
                  </div>
                  {selectedMedia.width && selectedMedia.height && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span>{selectedMedia.width} × {selectedMedia.height} px</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded:</span>
                    <span>{format(new Date(selectedMedia.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Public URL</label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={selectedMedia.public_url} className="font-mono text-[11px]" />
                    <Button size="icon" variant="outline" onClick={() => handleCopyUrl(selectedMedia.public_url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground bg-muted p-2 rounded border font-mono">
                    ![{selectedMedia.alt_text || 'alt text'}]({selectedMedia.public_url})
                  </p>
                </div>

                <div className="border-t pt-4 flex flex-col gap-2">
                  <Button className="w-full bg-[#E8400C] hover:bg-[#c4360a] text-white" onClick={() => handleCopyUrl(selectedMedia.public_url)}>
                    Copy Public URL
                  </Button>
                  <Button variant="outline" className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20" onClick={() => handleDelete(selectedMedia.id)}>
                    Delete File Permanently
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
