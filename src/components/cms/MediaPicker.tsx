'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MediaPickerProps {
  onSelect: (url: string, altText: string) => void
  trigger?: React.ReactNode
}

export function MediaPicker({ onSelect, trigger }: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('all')
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function loadMedia(query = '', selectedFolder = folder) {
    setLoading(true)
    let q = supabase.from('media').select('*').order('created_at', { ascending: false })
    if (query) q = q.ilike('filename', `%${query}%`)
    if (selectedFolder && selectedFolder !== 'all') q = q.eq('folder', selectedFolder)
    const { data } = await q.limit(50)
    setMedia(data || [])
    setLoading(false)
  }

  function handleOpen() {
    setOpen(true)
    loadMedia(search, folder)
  }

  function handleFolderChange(newFolder: string) {
    setFolder(newFolder)
    loadMedia(search, newFolder)
  }

  function handleSelect(item: any) {
    onSelect(item.public_url, item.alt_text || '')
    setOpen(false)
  }

  return (
    <>
      <div onClick={handleOpen} className="inline-block cursor-pointer">
        {trigger || (
          <Button variant="outline" size="sm" type="button">
            <ImageIcon className="h-4 w-4 mr-2" /> Choose Image
          </Button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 my-2">
            <Input
              placeholder="Search images..."
              value={search}
              onChange={e => { setSearch(e.target.value); loadMedia(e.target.value, folder) }}
              className="flex-1"
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={folder}
              onChange={e => handleFolderChange(e.target.value)}
            >
              <option value="all">All Folders</option>
              <option value="general">General</option>
              <option value="blog">Blog</option>
              <option value="projects">Projects</option>
              <option value="products">Products</option>
              <option value="logos">Logos</option>
              <option value="team">Team</option>
              <option value="og-images">OG Images</option>
            </select>
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {loading ? (
              <div className="grid grid-cols-5 gap-3">
                {Array(10).fill(0).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : media.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No media files found. Upload images from the Media Library.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {media.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="aspect-square cursor-pointer rounded overflow-hidden border-2 border-transparent hover:border-[#E8400C] transition-colors relative group bg-muted/30 flex items-center justify-center"
                  >
                    <img
                      src={item.public_url}
                      alt={item.alt_text || item.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-1">
                      <span className="text-[10px] text-white bg-black/60 px-1 py-0.5 rounded truncate w-full opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.filename}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
