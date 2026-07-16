'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { History, RotateCcw, Clock, User, Check, Eye, AlertCircle } from 'lucide-react'

interface Revision {
  id: string
  doc_id: string
  title: string
  content: string
  excerpt: string | null
  slug: string | null
  status: string | null
  revision_notes: string | null
  created_at: string
  profiles?: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

interface RevisionHistoryPanelProps {
  docId: string | null
  isOpen: boolean
  onClose: () => void
  onRestored?: (updatedDoc: any) => void
}

export function RevisionHistoryPanel({ docId, isOpen, onClose, onRestored }: RevisionHistoryPanelProps) {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [selectedRev, setSelectedRev] = useState<Revision | null>(null)
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const loadRevisions = async () => {
    if (!docId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/cms/revisions/${docId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load revisions')
      setRevisions(data.revisions || [])
      if (data.revisions && data.revisions.length > 0) {
        setSelectedRev(data.revisions[0])
      }
    } catch (err: any) {
      toast.error('Error fetching history: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && docId) {
      loadRevisions()
    } else {
      setSelectedRev(null)
    }
  }, [isOpen, docId])

  const handleRestore = async (rev: Revision) => {
    if (!confirm(`Are you sure you want to restore "${rev.title}" (${format(new Date(rev.created_at), 'MMM d, h:mm a')})? The current editor state will be saved as a revision before rollback.`)) return

    setRestoring(true)
    try {
      const res = await fetch('/api/cms/revisions/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision_id: rev.id, doc_id: docId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to restore')

      toast.success('Restored document to revision from ' + formatDistanceToNow(new Date(rev.created_at), { addSuffix: true }))
      if (onRestored) onRestored(data.doc)
      onClose()
    } catch (err: any) {
      toast.error('Rollback failed: ' + err.message)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto flex flex-col p-6">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#E8400C]" /> Document Revision History
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Explore automatic snapshots created prior to content modifications and rollback whenever needed.
          </p>
        </SheetHeader>

        {!docId ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Please save the document once before tracking revisions.
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">Loading revision snapshots...</div>
        ) : revisions.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
            <Clock className="h-8 w-8 mx-auto opacity-50 mb-1" />
            <p>No revision snapshots recorded for this document yet.</p>
            <p className="text-xs">Revisions are automatically captured whenever title, status, or content is modified.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 flex-1 overflow-hidden">
            {/* Left Column: Revision List (5 cols) */}
            <div className="md:col-span-5 border rounded-lg overflow-y-auto max-h-[650px] divide-y bg-muted/10">
              {revisions.map(rev => (
                <button
                  key={rev.id}
                  onClick={() => setSelectedRev(rev)}
                  className={`w-full text-left p-3 transition-colors flex flex-col gap-1.5 ${
                    selectedRev?.id === rev.id
                      ? 'bg-[#E8400C]/10 border-l-4 border-[#E8400C]'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground truncate">{rev.title}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">{rev.status || 'draft'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(rev.created_at), { addSuffix: true })}
                    </span>
                    <span className="truncate max-w-[100px]">{rev.profiles?.full_name || 'System'}</span>
                  </div>
                  {rev.revision_notes && (
                    <p className="text-[10px] text-muted-foreground italic truncate">{rev.revision_notes}</p>
                  )}
                </button>
              ))}
            </div>

            {/* Right Column: Preview & Restore (7 cols) */}
            <div className="md:col-span-7 flex flex-col border rounded-lg bg-background overflow-hidden max-h-[650px]">
              {selectedRev ? (
                <>
                  <div className="p-4 bg-muted/30 border-b flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm truncate">{selectedRev.title}</h4>
                      <div className="text-xs text-muted-foreground">
                        Snapshot from {format(new Date(selectedRev.created_at), 'PPP pp')} by {selectedRev.profiles?.full_name || 'System'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#E8400C] hover:bg-[#c4360a] text-white shrink-0"
                      onClick={() => handleRestore(selectedRev)}
                      disabled={restoring}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      {restoring ? 'Restoring...' : 'Restore This Version'}
                    </Button>
                  </div>

                  <div className="p-4 overflow-y-auto flex-1 font-mono text-xs whitespace-pre-wrap leading-relaxed bg-muted/5">
                    <div className="text-[10px] uppercase font-sans text-muted-foreground font-bold mb-2 pb-1 border-b">
                      Content Snapshot Preview ({selectedRev.content?.length || 0} chars)
                    </div>
                    {selectedRev.content || <span className="italic text-muted-foreground">Empty content</span>}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-muted-foreground text-sm m-auto">
                  Select a revision from the left list to inspect its content snapshot.
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
