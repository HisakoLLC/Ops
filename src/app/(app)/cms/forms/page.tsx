'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { Mail, Search, Download, Trash2, ExternalLink, Filter, CheckCircle2, AlertCircle, Clock, Archive } from 'lucide-react'

interface FormSubmission {
  id: string
  form_type: string
  name: string | null
  email: string
  company: string | null
  phone: string | null
  message: string | null
  status: 'new' | 'read' | 'in_progress' | 'replied' | 'spam' | 'archived'
  created_at: string
}

export default function FormsDashboardPage() {
  const supabase = createClient()
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadSubmissions = async () => {
    setLoading(true)
    let query = supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (typeFilter !== 'all') {
      query = query.eq('form_type', typeFilter)
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      toast.error('Failed to load form submissions: ' + error.message)
    } else {
      setSubmissions(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSubmissions()
  }, [typeFilter, statusFilter])

  const handleStatusChange = async (id: string, newStatus: FormSubmission['status']) => {
    const { error } = await supabase
      .from('form_submissions')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update status: ' + error.message)
    } else {
      toast.success('Status updated')
      setSubmissions(submissions.map(s => s.id === id ? { ...s, status: newStatus } : s))
    }
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Permanently delete submission from ${email}?`)) return

    const { error } = await supabase.from('form_submissions').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete: ' + error.message)
    } else {
      toast.success('Submission deleted')
      setSubmissions(submissions.filter(s => s.id !== id))
    }
  }

  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      toast.error('No submissions to export')
      return
    }

    const headers = ['ID', 'Type', 'Status', 'Name', 'Email', 'Company', 'Phone', 'Message', 'Submitted At']
    const rows = filteredSubmissions.map(s => [
      s.id,
      s.form_type,
      s.status,
      s.name || '',
      s.email,
      s.company || '',
      s.phone || '',
      (s.message || '').replace(/(\r\n|\n|\r)/gm, ' '),
      s.created_at
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `hisako_form_submissions_${format(new Date(), 'yyyyMMdd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV export generated')
  }

  const filteredSubmissions = submissions.filter(s => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.company && s.company.toLowerCase().includes(q)) ||
      (s.message && s.message.toLowerCase().includes(q))
    )
  })

  const getStatusBadge = (status: FormSubmission['status']) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">New</Badge>
      case 'read':
        return <Badge variant="secondary">Read</Badge>
      case 'in_progress':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">In Progress</Badge>
      case 'replied':
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">Replied</Badge>
      case 'spam':
        return <Badge variant="destructive">Spam</Badge>
      case 'archived':
        return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Forms & Lead Inquiries</h1>
          <p className="text-sm text-muted-foreground">Review, categorize, and respond to incoming inquiries from Hisako web properties.</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export CSV ({filteredSubmissions.length})
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-muted/30 p-3 rounded-lg border">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-semibold uppercase text-muted-foreground mr-1">Type:</span>
          {['all', 'contact', 'demo', 'newsletter', 'partner', 'general'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                typeFilter === type
                  ? 'bg-[#E8400C] text-white shadow-sm'
                  : 'bg-background hover:bg-muted text-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground mr-1">Status:</span>
          <select
            className="h-8 rounded border border-input bg-background px-2 text-xs font-medium"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="new">New (Unread)</option>
            <option value="read">Read</option>
            <option value="in_progress">In Progress</option>
            <option value="replied">Replied</option>
            <option value="spam">Spam</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, company, or message text..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Message Preview</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">Loading inquiries...</td>
              </tr>
            ) : filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No form submissions found matching your filters.
                </td>
              </tr>
            ) : (
              filteredSubmissions.map(sub => (
                <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">
                    <Badge variant="outline" className="font-mono text-[10px]">{sub.form_type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{sub.name || 'Anonymous Inquiry'}</div>
                    <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <a href={`mailto:${sub.email}`} className="hover:text-[#E8400C] hover:underline">{sub.email}</a>
                    </div>
                    {sub.company && <div className="text-[11px] text-muted-foreground">Company: {sub.company}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-sm">
                    <p className="line-clamp-2">{sub.message || '(No message content)'}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getStatusBadge(sub.status)}
                      <select
                        className="text-[11px] border rounded bg-background px-1 py-0.5 text-muted-foreground cursor-pointer hover:text-foreground"
                        value={sub.status}
                        onChange={e => handleStatusChange(sub.id, e.target.value as any)}
                      >
                        <option value="new">Mark New</option>
                        <option value="read">Mark Read</option>
                        <option value="in_progress">In Progress</option>
                        <option value="replied">Replied</option>
                        <option value="spam">Mark Spam</option>
                        <option value="archived">Archive</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    <span title={format(new Date(sub.created_at), 'PPP pp')}>
                      {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/cms/forms/${sub.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs hover:text-[#E8400C]">
                          View Details →
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(sub.id, sub.email)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
