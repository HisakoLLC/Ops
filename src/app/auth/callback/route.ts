import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if this is a password reset or invite flow
      // If the user came from an invite, they usually don't have a password set yet
      // You can redirect to an update-password page if 'next' is set to it in the email template,
      // or we can unconditionally redirect to update-password if it's an invite flow.
      // Usually, the invite flow sends a 'next=/update-password' or similar.
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Invalid+or+expired+invite+link`)
}
