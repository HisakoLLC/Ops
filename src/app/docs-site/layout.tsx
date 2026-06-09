import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { JetBrains_Mono } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: { default: 'Hisako Docs', template: '%s — Hisako Docs' },
  description: 'Documentation, articles, and project write-ups from Hisako.',
  metadataBase: new URL('https://docs.hisako.eu'),
}

export default function DocsSiteLayout({ children }: { children: React.ReactNode }) {
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
            <Link href="/articles" className="transition-colors hover:text-[#E8400C] text-foreground/80">Articles</Link>
            <Link href="/projects" className="transition-colors hover:text-[#E8400C] text-foreground/80">Projects</Link>
            <Link href="/products" className="transition-colors hover:text-[#E8400C] text-foreground/80">Products</Link>
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
            <Link href="/articles" className="hover:text-foreground">Articles</Link>
            <Link href="/projects" className="hover:text-foreground">Projects</Link>
            <Link href="/products" className="hover:text-foreground">Products</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
