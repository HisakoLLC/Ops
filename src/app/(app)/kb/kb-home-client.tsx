"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Pin, Search, FileText, ChevronRight, BookOpen, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function KBHomeClient({ articles, search, stats, isAdmin }: { articles: any[], search: string, stats: any, isAdmin: boolean }) {
  const pinned = articles.filter(a => a.pinned);
  const recent = articles.filter(a => !a.pinned).slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Knowledge Base</h1>
          <p className="text-zinc-500">Internal SOPs, processes, and documentation.</p>
        </div>
        {isAdmin && (
          <Link href="/kb/new">
            <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90">
              <FileText className="mr-2 h-4 w-4" /> New Article
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-950 border rounded-xl p-4 flex items-center gap-4">
          <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg">
            <FileText className="h-5 w-5 text-zinc-500" />
          </div>
          <div>
            <div className="text-sm text-zinc-500">Total Articles</div>
            <div className="text-xl font-bold">{stats.articles}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 border rounded-xl p-4 flex items-center gap-4">
          <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg">
            <BookOpen className="h-5 w-5 text-zinc-500" />
          </div>
          <div>
            <div className="text-sm text-zinc-500">Categories</div>
            <div className="text-xl font-bold">{stats.categories}</div>
          </div>
        </div>
      </div>

      {search && (
        <div className="mb-6 bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg text-sm text-zinc-600 flex items-center">
          <Search className="h-4 w-4 mr-2" />
          Showing results for &quot;{search}&quot;
        </div>
      )}

      {pinned.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Pin className="h-4 w-4 text-[#E8400C]" /> Pinned Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinned.map(a => (
              <Link key={a.id} href={`/kb/article/${a.slug}`}>
                <Card className="hover:border-[#E8400C]/50 hover:shadow-sm transition-all h-full">
                  <CardContent className="p-5 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {a.kb_categories && <Badge variant="secondary" className="text-[10px] uppercase">{a.kb_categories.name}</Badge>}
                      </div>
                      <h3 className="font-semibold text-lg line-clamp-2 leading-tight mb-2 group-hover:text-[#E8400C] transition-colors">{a.title}</h3>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={a.profiles?.avatar_url} />
                          <AvatarFallback className="text-[10px]">{a.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-zinc-500 truncate">{a.profiles?.full_name?.split(' ')[0]}</span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {format(parseISO(a.updated_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-500" /> {search ? 'Search Results' : 'Recent Articles'}
        </h2>
        <div className="bg-white dark:bg-zinc-950 border rounded-xl overflow-hidden">
          {recent.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No articles found.</div>
          ) : (
            <div className="divide-y">
              {recent.map(a => (
                <Link key={a.id} href={`/kb/article/${a.slug}`} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="bg-zinc-100 dark:bg-zinc-900 h-10 w-10 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-zinc-400 group-hover:text-[#E8400C] transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-[#E8400C] transition-colors">{a.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                        {a.kb_categories?.name && <span>{a.kb_categories.name}</span>}
                        {a.kb_categories?.name && <span>•</span>}
                        <span>Updated {format(parseISO(a.updated_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-[#E8400C] transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
