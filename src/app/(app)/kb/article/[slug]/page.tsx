import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, ChevronRight, BookOpen, Pin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KBArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user?.id).single();
  const isAdmin = profile?.role === 'admin';

  const { data: article } = await supabase
    .from('kb_articles')
    .select('*, kb_categories(name, icon), profiles:updated_by(full_name, avatar_url)')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!article) notFound();

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 pb-20">
      <div className="flex items-center text-sm text-zinc-500 mb-6 gap-2 flex-wrap">
        <Link href="/kb" className="hover:text-zinc-900 transition-colors flex items-center gap-1">
          <BookOpen className="h-4 w-4" /> KB Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        {article.kb_categories ? (
          <>
            <Link href={`/kb/category/${article.category_id}`} className="hover:text-zinc-900 transition-colors">
              {article.kb_categories.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        ) : null}
        <span className="text-zinc-900 truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 flex items-center gap-3">
            {article.title}
            {article.pinned && <Pin className="h-5 w-5 text-[#E8400C]" />}
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={article.profiles?.avatar_url} />
                <AvatarFallback className="text-[10px]">{article.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-zinc-500">Updated by {article.profiles?.full_name?.split(' ')[0]} on {format(parseISO(article.updated_at), 'MMM d, yyyy')}</span>
            </div>
            {article.tags?.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-300">•</span>
                {article.tags.map((t: string) => <Badge key={t} variant="secondary" className="font-normal text-xs">{t}</Badge>)}
              </div>
            )}
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" asChild>
            <Link href={`/kb/article/${article.slug}/edit`}><Edit className="h-4 w-4 mr-2" /> Edit</Link>
          </Button>
        )}
      </div>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-m-20 prose-a:text-[#E8400C] prose-a:no-underline hover:prose-a:underline">
        <ReactMarkdown>{article.content || '*No content available.*'}</ReactMarkdown>
      </div>

      <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-sm text-zinc-500">
        <div>Was this article helpful?</div>
        {isAdmin && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/kb/article/${article.slug}/edit`} className="text-zinc-500 hover:text-zinc-900">
              <Edit className="h-4 w-4 mr-2" /> Edit this article
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
