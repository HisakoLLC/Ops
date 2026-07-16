import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: getCorsHeaders() })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      form_type = 'general',
      name = '',
      email = '',
      company = '',
      phone = '',
      message = '',
      _website = '', // Honeypot field
      metadata = {},
    } = body

    // 1. Honeypot check (bot trap)
    if (_website && _website.trim().length > 0) {
      console.log('Spam bot detected via honeypot _website field:', _website)
      return NextResponse.json({ success: true, message: 'Form submitted successfully' }, { status: 200, headers: getCorsHeaders() })
    }

    // 2. Validate email
    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400, headers: getCorsHeaders() })
    }

    // 3. Extract IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'

    // 4. Insert into form_submissions table via Supabase
    const supabase = await createClient()
    const { data: submission, error: dbError } = await supabase
      .from('form_submissions')
      .insert({
        form_type: form_type.toLowerCase(),
        name: name.trim() || null,
        email: email.trim().toLowerCase(),
        company: company.trim() || null,
        phone: phone.trim() || null,
        message: message.trim() || null,
        metadata: {
          ...metadata,
          user_agent: request.headers.get('user-agent') || 'unknown',
          submitted_at: new Date().toISOString(),
        },
        status: 'new',
        ip_address: ip,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error inserting form submission:', dbError)
      return NextResponse.json({ error: 'Failed to save submission: ' + dbError.message }, { status: 500, headers: getCorsHeaders() })
    }

    // 5. Send email notification via Resend (if RESEND_API_KEY is configured)
    const resendApiKey = process.env.RESEND_API_KEY
    const contactEmail = process.env.CONTACT_EMAIL || 'ops@hisako.eu'

    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Hisako Ops <notifications@hisako.eu>',
            to: contactEmail,
            subject: `[New Inquiry - ${form_type.toUpperCase()}] from ${name || email}`,
            html: `
              <h2>New Form Submission: ${form_type.toUpperCase()}</h2>
              <p><strong>Name:</strong> ${name || 'N/A'}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Company:</strong> ${company || 'N/A'}</p>
              <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
              <hr />
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message || 'No message provided.'}</p>
              <hr />
              <p><small>View details in <a href="https://ops.hisako.eu/cms/forms/${submission.id}">Hisako Ops Forms Dashboard</a></small></p>
            `,
          }),
        })
      } catch (emailErr) {
        console.error('Failed to send Resend email notification:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      id: submission?.id,
      message: 'Form submitted successfully',
    }, { status: 200, headers: getCorsHeaders() })

  } catch (err: any) {
    console.error('Error in form submit API:', err)
    return NextResponse.json({ error: 'Invalid request payload: ' + err.message }, { status: 400, headers: getCorsHeaders() })
  }
}
