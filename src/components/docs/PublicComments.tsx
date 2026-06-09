'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export function PublicComments({ docId, initialComments }: { docId: string, initialComments: any[] }) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !content) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    const { error } = await supabase.from('doc_comments').insert({
      doc_id: docId,
      author_name: name,
      author_email: email,
      content,
      approved: false
    })
    setIsSubmitting(false)

    if (error) {
      toast.error('Failed to post comment')
    } else {
      toast.success('Comment submitted! It will appear after approval.')
      setName('')
      setEmail('')
      setContent('')
    }
  }

  return (
    <div className="mt-16 border-t pt-12">
      <h3 className="text-2xl font-bold mb-8">Comments</h3>
      
      {initialComments.length > 0 ? (
        <div className="space-y-6 mb-12">
          {initialComments.map(c => (
            <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <div className="font-semibold">{c.author_name}</div>
                <div className="text-xs text-muted-foreground">&bull; {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</div>
              </div>
              <p className="text-zinc-800 dark:text-zinc-200">{c.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mb-12">No comments yet. Be the first to share your thoughts!</p>
      )}

      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-lg border">
        <h4 className="font-semibold text-lg mb-4">Leave a Reply</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email (won't be published)" required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Comment</label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share your thoughts..." rows={4} required />
          </div>
          <Button type="submit" disabled={isSubmitting} className="bg-[#E8400C] hover:bg-[#c4360a] text-white">
            {isSubmitting ? 'Submitting...' : 'Post Comment'}
          </Button>
        </form>
      </div>
    </div>
  )
}
