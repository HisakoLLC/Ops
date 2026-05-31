'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Send, Loader2 } from 'lucide-react'

interface Props {
  documentId: string
  clientEmail: string
  clientName: string
  docLabel: string
  docType: string
}

export default function SendDocumentButton({
  documentId, clientEmail, clientName, docLabel, docType
}: Props) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(clientEmail)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Only show for client-facing docs
  const clientFacingDocs = ['proposal','nda','services_agreement','pipeline_handover','monthly_report']
  if (!clientFacingDocs.includes(docType)) return null

  async function handleSend() {
    setSending(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'document',
          to,
          documentId,
          templateData: { message: message || undefined },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`${docLabel} sent to ${to}`)
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Send className="h-3.5 w-3.5" />
        Send to Client
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send {docLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="to">Recipient email</Label>
              <Input
                id="to"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="client@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg">
                Personal message
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              </Label>
              <Textarea
                id="msg"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Add a note to include in the email body..."
                rows={3}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The document will be attached as a .docx file.
              Sent from notify@notify.hisako.eu
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={sending || !to}
              className="bg-[#E8400C] hover:bg-[#C73509] text-white"
            >
              {sending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />Send Document</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
