'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function CommentsClient({ doc, initialComments }: { doc: { id: string, title: string }, initialComments: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [comments, setComments] = useState(initialComments)

  const pendingComments = comments.filter(c => !c.approved)
  const approvedComments = comments.filter(c => c.approved)

  const handleUpdateApproval = async (id: string, approved: boolean) => {
    const { error } = await supabase.from('doc_comments').update({ approved }).eq('id', id)
    if (error) {
      toast.error('Failed to update comment')
    } else {
      toast.success(approved ? 'Comment approved' : 'Approval removed')
      setComments(comments.map(c => c.id === id ? { ...c, approved } : c))
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    const { error } = await supabase.from('doc_comments').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete comment')
    } else {
      toast.success('Comment deleted')
      setComments(comments.filter(c => c.id !== id))
      router.refresh()
    }
  }

  const renderComment = (c: any) => (
    <Card key={c.id} className="mb-4">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{c.author_name}</span>
            <span className="text-xs text-muted-foreground">{c.author_email}</span>
            <span className="text-xs text-muted-foreground">&bull; {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
          </div>
          <p className="text-sm bg-muted/50 p-3 rounded text-zinc-800 dark:text-zinc-200">{c.content}</p>
        </div>
        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
          {!c.approved ? (
            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950" onClick={() => handleUpdateApproval(c.id, true)}>
              <CheckCircle className="h-4 w-4 mr-2" /> Approve
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950" onClick={() => handleUpdateApproval(c.id, false)}>
              <XCircle className="h-4 w-4 mr-2" /> Unapprove
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDelete(c.id)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/docs/${doc.id}/edit`)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comments — {doc.title}</h1>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Pending Approval ({pendingComments.length})</h2>
          {pendingComments.length > 0 ? (
            pendingComments.map(renderComment)
          ) : (
            <p className="text-sm text-muted-foreground">No pending comments.</p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Approved ({approvedComments.length})</h2>
          {approvedComments.length > 0 ? (
            approvedComments.map(renderComment)
          ) : (
            <p className="text-sm text-muted-foreground">No approved comments.</p>
          )}
        </section>
      </div>
    </div>
  )
}
