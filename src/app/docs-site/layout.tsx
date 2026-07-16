import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { JetBrains_Mono } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: { default: 'Hisako Docs', template: '%s — Hisako Docs' },
  description: 'Documentation, articles, and project write-ups from Hisako.',
  metadataBase: new URL('https://docs.hisako.eu'),
}

export default async function DocsSiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  
  const { data: menuData } = await supabase
    .from('nav_menus')
    .select('id')
    .eq('slug', 'docs-header')
    .single()

  let navItems: any[] = []
  if (menuData) {
    const { data: items } = await supabase
      .from('nav_items')
      .select('label, href, target, sort_order')
      .eq('menu_id', menuData.id)
      .order('sort_order', { ascending: true })
    if (items) navItems = items
  }

  // Fallback if DB menu not seeded or empty
  if (navItems.length === 0) {
    navItems = [
      { label: 'Articles', href: '/articles', target: '_self' },
      { label: 'Projects', href: '/projects', target: '_self' },
      { label: 'Products', href: '/products', target: '_self' },
    ]
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col font-sans ${jetbrainsMono.variable}`}>
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-14 border-b">
        <div className="mx-auto max-w-6xl flex h-full items-center px-4 justify-between">
          <div className="flex items-center gap-1">
            <Link href="/" className="font-mono text-xs font-bold tracking-tight">
              HISAKO DOCS
            </Link>
            <a href="https://hisako.eu" className="text-[10px] text-muted-foreground hover:text-[#E8400C] transition-colors -mt-2">
              ↗
            </a>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                target={item.target || '_self'}
                className="transition-colors hover:text-[#E8400C] text-foreground/80"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground">
              <Search className="h-4 w-4" />
            </button>
            <a href="https://hisako.eu" className="hidden sm:inline-flex h-8 items-center justify-center rounded-md bg-[#E8400C] hover:bg-[#c4360a] px-3 text-xs font-medium text-white transition-colors">
              hisako.eu →
            </a>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 md:flex-row px-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Hisako Technologies Limited. All rights reserved.</p>
          <div className="flex gap-4">
            {navItems.map((item, index) => (
              <Link key={index} href={item.href} target={item.target || '_self'} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
