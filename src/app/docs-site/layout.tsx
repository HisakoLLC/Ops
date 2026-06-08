import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Hisako Docs',
  description: 'Official documentation, project write-ups, and insights from Hisako EU.',
}

export default function DocsSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl flex h-16 items-center px-4 justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-10 flex items-center space-x-2">
              <BookOpen className="h-6 w-6" />
              <span className="font-bold sm:inline-block text-lg">Hisako Docs</span>
            </Link>
            <nav className="flex items-center space-x-8 text-base font-medium">
              <Link href="/article" className="transition-colors hover:text-foreground/80 text-foreground/60 py-2">Articles</Link>
              <Link href="/project_doc" className="transition-colors hover:text-foreground/80 text-foreground/60 py-2">Projects</Link>
              <Link href="/product_doc" className="transition-colors hover:text-foreground/80 text-foreground/60 py-2">Products</Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Hisako EU. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
