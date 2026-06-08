import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Extract hostname (e.g. 'docs.hisako.eu' or 'docs.localhost:3000')
  const hostname = request.headers.get('host')

  // Rewrite docs subdomain to /docs-site
  if (
    hostname === 'docs.hisako.eu' ||
    hostname === 'docs.localhost:3000' ||
    hostname?.startsWith('docs.')
  ) {
    // Avoid double-rewriting if someone directly visits /docs-site on the subdomain
    if (!request.nextUrl.pathname.startsWith('/docs-site')) {
      const url = request.nextUrl.clone()
      url.pathname = `/docs-site${request.nextUrl.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
