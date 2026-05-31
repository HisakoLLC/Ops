import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  const cookieStore = await cookies()

  const createSupabase = (response: NextResponse) =>
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

  // ── Flow 1: PKCE code exchange (magic link / OAuth) ──────────────────────
  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`)
    const supabase = createSupabase(response)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return response
  }

  // ── Flow 2: token_hash (email invite / password recovery) ─────────────────
  if (token_hash && type) {
    // For invites and password resets, redirect to the set-password page
    const redirectTo = (type === 'invite' || type === 'recovery')
      ? `${origin}/update-password`
      : `${origin}${next}`

    const response = NextResponse.redirect(redirectTo)
    const supabase = createSupabase(response)
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return response
  }

  // ── Fallback: something went wrong ────────────────────────────────────────
  return NextResponse.redirect(`${origin}/login?error=Invalid+or+expired+invite+link`)
}
