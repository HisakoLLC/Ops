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
  invoiceId: string
  clientEmail: string
  invoiceRef: string
  amount: string
  onSuccess?: () => void
  dueDate?: string
  clientName: string
}

export default function SendInvoiceButton({
  invoiceId, clientEmail, invoiceRef, amount, onSuccess, dueDate, clientName
}: Props) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(clientEmail)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    setSending(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice',
          to,
          documentId: invoiceId, // We'll re-use documentId for the ID of the invoice
          templateData: { message: message || undefined, invoiceRef, amount, dueDate, clientName },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`Invoice ${invoiceRef} sent to ${to}`)
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Send className="h-4 w-4 mr-2" /> Send
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Invoice {invoiceRef}</DialogTitle>
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
              The invoice will be generated on the fly and attached to this email as a PDF.
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending} className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90">
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invoice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
