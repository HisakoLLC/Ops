'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2 } from 'lucide-react'

interface FeedbackFormProps {
  docTitle?: string
  docUrl?: string
}

export function FeedbackForm({ docTitle = 'Documentation Page', docUrl = '' }: FeedbackFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [helpful, setHelpful] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuickHelpful = async (val: boolean) => {
    setHelpful(val)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !message) {
      toast.error('Email and message are required')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/cms/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: 'general',
          name: 'Documentation Reader',
          email: email.trim(),
          message: `[Feedback on "${docTitle}" - Helpful: ${helpful !== null ? (helpful ? 'Yes' : 'No') : 'N/A'}]\n\n${message.trim()}`,
          metadata: {
            page_url: docUrl || typeof window !== 'undefined' ? window.location.href : '',
            doc_title: docTitle,
            helpful_rating: helpful,
          }
        })
      })

      if (!res.ok) {
        throw new Error('Submission failed')
      }

      setSubmitted(true)
      toast.success('Thank you for your feedback!')
    } catch (err: any) {
      toast.error('Could not submit feedback: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="border rounded-lg p-4 bg-muted/20 text-center space-y-1 text-sm">
        <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
          <CheckCircle2 className="h-4 w-4" /> Thank you for helping us improve our documentation!
        </div>
        <p className="text-xs text-muted-foreground">Our team has received your comments.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6 bg-muted/10 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-sm">Was this page helpful?</h4>
          <p className="text-xs text-muted-foreground">Let us know if this documentation answered your questions or needs improvement.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant={helpful === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickHelpful(true)}
            className={helpful === true ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          >
            <ThumbsUp className="h-3.5 w-3.5 mr-1.5" /> Yes
          </Button>
          <Button
            type="button"
            variant={helpful === false ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickHelpful(false)}
            className={helpful === false ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            <ThumbsDown className="h-3.5 w-3.5 mr-1.5" /> No
          </Button>
          {!isOpen && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Comment
            </Button>
          )}
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Your Email (to follow up if needed)</label>
            <Input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Your Feedback / Questions</label>
            <Textarea
              required
              placeholder="What did you like, or what information were you looking for?"
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="text-xs resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="bg-[#E8400C] hover:bg-[#c4360a] text-white" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
