'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ArrowLeft, Mail, Phone, Building2, Globe, Clock, Save, Trash2, Send, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface FormSubmission {
  id: string
  form_type: string
  name: string | null
  email: string
  company: string | null
  phone: string | null
  message: string | null
  metadata: any
  status: 'new' | 'read' | 'in_progress' | 'replied' | 'spam' | 'archived'
  notes: string | null
  ip_address: string | null
  created_at: string
}

export default function FormDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const supabase = createClient()

  const [submission, setSubmission] = useState<FormSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const loadSubmission = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      toast.error('Failed to load submission details')
      router.push('/cms/forms')
    } else {
      setSubmission(data)
      setNotes(data.notes || '')
      // Automatically mark as 'read' if it was 'new'
      if (data.status === 'new') {
        await supabase.from('form_submissions').update({ status: 'read' }).eq('id', id)
        setSubmission({ ...data, status: 'read' })
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    if (id) loadSubmission()
  }, [id])

  const handleStatusChange = async (newStatus: FormSubmission['status']) => {
    if (!submission) return
    const { error } = await supabase
      .from('form_submissions')
      .update({ status: newStatus })
      .eq('id', submission.id)

    if (error) {
      toast.error('Failed to update status: ' + error.message)
    } else {
      toast.success('Status updated to ' + newStatus)
      setSubmission({ ...submission, status: newStatus })
    }
  }

  const handleSaveNotes = async () => {
    if (!submission) return
    setSavingNotes(true)
    const { error } = await supabase
      .from('form_submissions')
      .update({ notes: notes.trim() })
      .eq('id', submission.id)

    if (error) {
      toast.error('Failed to save notes: ' + error.message)
    } else {
      toast.success('Internal team notes saved')
    }
    setSavingNotes(false)
  }

  const handleDelete = async () => {
    if (!submission) return
    if (!confirm(`Are you sure you want to permanently delete inquiry from ${submission.email}?`)) return

    const { error } = await supabase.from('form_submissions').delete().eq('id', submission.id)
    if (error) {
      toast.error('Failed to delete: ' + error.message)
    } else {
      toast.success('Inquiry deleted')
      router.push('/cms/forms')
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading inquiry details...</div>
  }

  if (!submission) return null

  const getStatusBadge = (status: FormSubmission['status']) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-600 text-white">New</Badge>
      case 'read':
        return <Badge variant="secondary">Read</Badge>
      case 'in_progress':
        return <Badge className="bg-amber-500 text-white">In Progress</Badge>
      case 'replied':
        return <Badge className="bg-green-600 text-white">Replied</Badge>
      case 'spam':
        return <Badge variant="destructive">Spam</Badge>
      case 'archived':
        return <Badge variant="outline">Archived</Badge>
    }
  }

  const meta = submission.metadata || {}

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Nav */}
      <div className="flex items-center justify-between border-b pb-4">
        <Link href="/cms/forms">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Inquiries
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Contact & Message (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="border rounded-lg p-6 bg-background space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="uppercase font-mono text-xs">{submission.form_type}</Badge>
                  {getStatusBadge(submission.status)}
                </div>
                <h1 className="text-2xl font-bold text-foreground">{submission.name || 'Anonymous Inquiry'}</h1>
              </div>
              <div className="text-right text-xs text-muted-foreground font-mono">
                {format(new Date(submission.created_at), 'PPP p')}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${submission.email}`} className="font-mono hover:text-[#E8400C] hover:underline truncate">
                  {submission.email}
                </a>
              </div>
              {submission.phone && (
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-mono">{submission.phone}</span>
                </div>
              )}
              {submission.company && (
                <div className="flex items-center gap-2 text-foreground sm:col-span-2">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-semibold">{submission.company}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Message Content</h3>
              <div className="bg-muted/30 p-4 rounded-md text-sm whitespace-pre-wrap leading-relaxed font-sans text-foreground border">
                {submission.message || <span className="italic text-muted-foreground">No message text provided.</span>}
              </div>
            </div>

            {/* Quick Reply CTA */}
            <div className="pt-2 flex justify-end">
              <a
                href={`mailto:${submission.email}?subject=Re: Your inquiry to Hisako (${submission.form_type.toUpperCase()})`}
                target="_blank"
                rel="noreferrer"
              >
                <Button className="bg-[#E8400C] hover:bg-[#c4360a] text-white">
                  <Send className="h-4 w-4 mr-2" /> Reply via Email (`mailto`)
                </Button>
              </a>
            </div>
          </div>

          {/* Internal Team Notes */}
          <div className="border rounded-lg p-6 bg-background space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">Internal Team Notes</h3>
                <p className="text-xs text-muted-foreground">Private notes about this lead or follow-up status (not visible to customer).</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={savingNotes}>
                <Save className="h-4 w-4 mr-2" /> {savingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
            <Textarea
              placeholder="Add follow-up notes, assigned sales rep comments, or qualification criteria..."
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Status & Technical Metadata (1 col) */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="border rounded-lg p-6 bg-background space-y-4 shadow-sm">
            <h3 className="font-semibold text-sm">Workflow Status</h3>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Current Status</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-medium"
                value={submission.status}
                onChange={e => handleStatusChange(e.target.value as any)}
              >
                <option value="new">New (Unread)</option>
                <option value="read">Read</option>
                <option value="in_progress">In Progress</option>
                <option value="replied">Replied</option>
                <option value="spam">Mark as Spam</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Technical Metadata */}
          <div className="border rounded-lg p-6 bg-background space-y-4 shadow-sm font-mono text-xs">
            <h3 className="font-semibold text-sm font-sans">Submission Diagnostics</h3>
            
            <div className="space-y-3 pt-2 border-t">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-sans">IP Address</span>
                <span>{submission.ip_address || 'Not recorded'}</span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-sans">Origin Page (`page_url`)</span>
                <span className="break-all">{meta.page_url || meta.referrer || 'Direct / API'}</span>
              </div>

              {meta.utm_source && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-sans">UTM Source</span>
                  <span>{meta.utm_source} ({meta.utm_medium || 'none'})</span>
                </div>
              )}

              {meta.utm_campaign && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-sans">UTM Campaign</span>
                  <span>{meta.utm_campaign}</span>
                </div>
              )}

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-sans">User Agent</span>
                <span className="text-[10px] text-muted-foreground break-all line-clamp-3">{meta.user_agent || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
