const baseStyles = `
  body { margin: 0; padding: 0; background: #F5F5F0; font-family: system-ui, -apple-system, Arial, sans-serif; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #FFFFFF; border: 1px solid #E0E0E0; }
  .header { padding: 32px 40px 24px; border-bottom: 1px solid #E0E0E0; }
  .mark { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; color: #0A0A0A; text-transform: uppercase; }
  .divider { width: 1px; height: 14px; background: #CCCCCC; display: inline-block; margin: 0 10px; vertical-align: middle; }
  .agency { font-size: 9px; letter-spacing: 0.15em; color: #888888; text-transform: uppercase; vertical-align: middle; font-family: 'Courier New', monospace; }
  .body { padding: 40px; }
  .label { font-size: 10px; font-family: 'Courier New', monospace; letter-spacing: 0.15em; text-transform: uppercase; color: #888888; margin-bottom: 8px; }
  .headline { font-size: 28px; font-weight: 900; color: #0A0A0A; line-height: 1.1; margin: 0 0 24px; }
  .text { font-size: 15px; color: #444444; line-height: 1.65; margin: 0 0 16px; }
  .rule { border: none; border-top: 1px solid #E0E0E0; margin: 32px 0; }
  .meta-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  .meta-table td { padding: 10px 0; border-bottom: 1px solid #F0F0F0; vertical-align: top; }
  .meta-key { font-family: 'Courier New', monospace; font-size: 10px; color: #888888; text-transform: uppercase; letter-spacing: 0.12em; width: 160px; }
  .meta-val { font-size: 14px; color: #0A0A0A; font-weight: 600; }
  .cta { display: block; background: #E8400C; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 32px; text-align: center; margin: 32px 0; }
  .cta:hover { background: #C73509; }
  .note { font-size: 13px; color: #888888; font-style: italic; }
  .footer { padding: 24px 40px; border-top: 1px solid #E0E0E0; }
  .footer-brand { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #0A0A0A; text-transform: uppercase; }
  .footer-text { font-size: 11px; color: #888888; margin-top: 4px; font-family: 'Courier New', monospace; }
  .signature { margin-top: 32px; padding-top: 24px; border-top: 1px solid #E0E0E0; }
  .sig-name { font-size: 15px; font-weight: 700; color: #0A0A0A; }
  .sig-title { font-size: 13px; color: #888888; font-family: 'Courier New', monospace; }
`

const emailHeader = () => `
  <div class="header">
    <span class="mark">HISAKO</span>
    <span class="divider"></span>
    <span class="agency">AI Agency</span>
  </div>
`

const emailFooter = (senderName = 'The Hisako Team') => `
  <div class="footer">
    <div class="footer-brand">Hisako Technologies Limited</div>
    <div class="footer-text">hello@hisako.eu  ·  hisako.eu  ·  Nairobi, Kenya</div>
    <div class="signature">
      <div class="sig-name">${senderName}</div>
      <div class="sig-title">Hisako Technologies</div>
    </div>
  </div>
`

// Template 1: Document delivery email
// Used when sending: Proposal, NDA, Services Agreement, Handover, Monthly Report
export function documentEmail(data: {
  clientName: string
  docType: string
  docLabel: string
  message?: string
  senderName?: string
}) {
  const docTypeLabels: Record<string, { headline: string; note: string }> = {
    proposal: {
      headline: 'Your Proposal is Ready.',
      note: 'Please review the attached proposal. If you have any questions or would like to discuss the details, reply to this email.',
    },
    nda: {
      headline: 'NDA for Your Review.',
      note: 'Please review the attached Non-Disclosure Agreement, sign, and return a copy to hello@hisako.eu.',
    },
    services_agreement: {
      headline: 'Services Agreement Attached.',
      note: 'Please review and sign the attached agreement. Once signed by both parties, work can begin.',
    },
    pipeline_handover: {
      headline: 'Your Pipeline is Live.',
      note: 'The attached document covers everything you need to monitor and maintain your pipeline. We remain available for any questions.',
    },
    monthly_report: {
      headline: `Pipeline Report — ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.`,
      note: 'Please find your monthly pipeline performance report attached. Reply with any questions.',
    },
  }

  const labels = docTypeLabels[data.docType] || {
    headline: `${data.docLabel} — From Hisako.`,
    note: 'Please find the attached document.',
  }

  return `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="wrapper">
        <div class="card">
          ${emailHeader()}
          <div class="body">
            <div class="label">Document Delivery</div>
            <h1 class="headline">${labels.headline}</h1>
            <p class="text">Hi ${data.clientName},</p>
            <p class="text">${data.message || labels.note}</p>
            <hr class="rule">
            <table class="meta-table">
              <tr>
                <td class="meta-key">Document</td>
                <td class="meta-val">${data.docLabel}</td>
              </tr>
              <tr>
                <td class="meta-key">From</td>
                <td class="meta-val">Hisako Technologies Limited</td>
              </tr>
              <tr>
                <td class="meta-key">Date</td>
                <td class="meta-val">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
              </tr>
            </table>
            <p class="note">Document attached to this email as a .docx file. Open in Microsoft Word or Google Docs.</p>
          </div>
          ${emailFooter(data.senderName)}
        </div>
        <p style="text-align:center;font-size:11px;color:#AAAAAA;font-family:'Courier New',monospace;margin-top:16px;">
          Sent via Hisako Ops  ·  notify.hisako.eu
        </p>
      </div>
    </body>
    </html>
  `
}

// Template 2: Proposal follow-up
export function followUpEmail(data: {
  clientName: string
  proposalDate: string
  senderName?: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="wrapper">
        <div class="card">
          ${emailHeader()}
          <div class="body">
            <div class="label">Following Up</div>
            <h1 class="headline">Checking in on the proposal.</h1>
            <p class="text">Hi ${data.clientName},</p>
            <p class="text">I wanted to follow up on the proposal we sent on ${data.proposalDate}. Happy to answer any questions, adjust the scope, or jump on a quick call if that helps.</p>
            <p class="text">Let me know either way — no pressure.</p>
            <div class="signature" style="margin-top:24px;padding-top:24px;border-top:1px solid #E0E0E0;">
              <div class="sig-name">${data.senderName || 'The Hisako Team'}</div>
              <div class="sig-title" style="font-size:13px;color:#888888;font-family:'Courier New',monospace;">Hisako Technologies Limited</div>
              <div class="sig-title" style="font-size:13px;color:#888888;margin-top:2px;">hello@hisako.eu</div>
            </div>
          </div>
          ${emailFooter(data.senderName)}
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 3: Welcome / onboarding started
export function onboardingEmail(data: {
  clientName: string
  projectName: string
  kickoffDate: string
  pmName: string
  senderName?: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="wrapper">
        <div class="card">
          ${emailHeader()}
          <div class="body">
            <div class="label">Engagement Started</div>
            <h1 class="headline">We're ready to build.</h1>
            <p class="text">Hi ${data.clientName},</p>
            <p class="text">Your engagement with Hisako is now active. Here's what happens next.</p>
            <hr class="rule">
            <table class="meta-table">
              <tr>
                <td class="meta-key">Project</td>
                <td class="meta-val">${data.projectName}</td>
              </tr>
              <tr>
                <td class="meta-key">Kickoff Date</td>
                <td class="meta-val">${data.kickoffDate}</td>
              </tr>
              <tr>
                <td class="meta-key">Your Contact</td>
                <td class="meta-val">${data.pmName} — hello@hisako.eu</td>
              </tr>
            </table>
            <p class="text">You'll receive a separate email with our tool access request. Please action it within 48 hours so we can begin the Map phase on schedule.</p>
            <p class="text">Questions before kickoff? Reply to this email.</p>
          </div>
          ${emailFooter(data.senderName)}
        </div>
      </div>
    </body>
    </html>
  `
}

// Template 4: Invoice
export function invoiceEmail(data: {
  clientName: string
  invoiceRef: string
  amount: string
  dueDate: string
  invoiceType: string
  senderName?: string
}) {
  const typeLabel = {
    deposit: '50% Deposit — Commencement of Work',
    final: 'Final Payment — Project Delivery',
    retainer: 'Monthly Retainer',
    adhoc: 'Invoice',
  }[data.invoiceType] || 'Invoice'

  return `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="wrapper">
        <div class="card">
          ${emailHeader()}
          <div class="body">
            <div class="label">Invoice</div>
            <h1 class="headline">${typeLabel}.</h1>
            <p class="text">Hi ${data.clientName || 'Client'},</p>
            <p class="text">Please find the invoice details below. ${data.dueDate ? `Payment is due ${data.dueDate}.` : 'Payment is due upon receipt.'}</p>
            <hr class="rule">
            <table class="meta-table">
              <tr>
                <td class="meta-key">Invoice Ref</td>
                <td class="meta-val">${data.invoiceRef}</td>
              </tr>
              <tr>
                <td class="meta-key">Description</td>
                <td class="meta-val">${typeLabel}</td>
              </tr>
              <tr>
                <td class="meta-key">Amount Due</td>
                <td class="meta-val" style="font-size:20px;font-weight:900;color:#0A0A0A;">${data.amount.includes('$') ? data.amount : `$${data.amount}`} USD</td>
              </tr>
              <tr>
                <td class="meta-key">Due Date</td>
                <td class="meta-val">${data.dueDate || 'Upon receipt'}</td>
              </tr>
            </table>
            <p class="note">Payment details are included in the attached invoice document. Please reference the invoice number in your payment.</p>
            <p class="text" style="margin-top:16px;">Questions about this invoice? Reply to this email or contact hello@hisako.eu.</p>
          </div>
          ${emailFooter(data.senderName)}
        </div>
      </div>
    </body>
    </html>
  `
}
