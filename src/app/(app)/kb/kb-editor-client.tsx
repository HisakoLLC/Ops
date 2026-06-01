"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Save, Bold, Italic, Heading2, Heading3, Link as LinkIcon, Code, List, Table2, ArrowLeft, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function KBEditorClient({ article, categories, currentUserId }: { article: any, categories: any[], currentUserId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    category_id: article?.category_id || '',
    content: article?.content || '',
    tags: article?.tags?.join(', ') || '',
    pinned: article?.pinned || false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-generate slug from title if empty
  useEffect(() => {
    if (!article && form.title && !form.slug) {
      setForm(prev => ({ ...prev, slug: prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }));
    }
  }, [form.title, article, form.slug]);

  const insertText = (before: string, after: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const newText = text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end);
    setForm({ ...form, content: newText });
    
    // Reset cursor position
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleSave = async (publish: boolean = false) => {
    if (!form.title || !form.slug || !form.category_id) {
      toast.error("Title, slug, and category are required");
      return;
    }
    
    setIsSaving(true);
    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      title: form.title,
      slug: form.slug,
      category_id: form.category_id,
      content: form.content,
      tags: tagsArray,
      pinned: form.pinned,
      updated_by: currentUserId
    };

    let result;
    if (article) {
      result = await supabase.from('kb_articles').update(payload).eq('id', article.id);
    } else {
      result = await supabase.from('kb_articles').insert([{ ...payload, created_by: currentUserId }]);
    }

    setIsSaving(false);

    if (result.error) {
      toast.error(result.error.message);
    } else {
      toast.success(article ? "Article updated" : "Article created");
      if (publish) {
        router.push(`/kb/article/${form.slug}`);
        router.refresh();
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950">
      <div className="flex-shrink-0 border-b p-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={article ? `/kb/article/${article.slug}` : "/kb"}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="font-semibold">{article ? 'Edit Article' : 'New Article'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" /> {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Draft
          </Button>
          <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90" onClick={() => handleSave(true)} disabled={isSaving}>
            Publish
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className={cn("flex-1 overflow-y-auto p-6 flex flex-col gap-6", showPreview && "lg:w-1/2 lg:border-r")}>
          <div className="grid gap-4">
            <Input 
              placeholder="Article Title" 
              className="text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-zinc-500 mb-1.5 block">Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm({...form, category_id: v ?? ''})}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-zinc-500 mb-1.5 block">URL Slug</Label>
                <Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <Label className="text-xs text-zinc-500 mb-1.5 block">Tags (comma separated)</Label>
                <Input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="e.g. pipeline, guide" />
              </div>
              <div className="flex items-center gap-2 h-10">
                <Switch checked={form.pinned} onCheckedChange={c => setForm({...form, pinned: c})} />
                <Label className="cursor-pointer">Pin to top</Label>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col border rounded-xl overflow-hidden mt-2">
            <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 dark:bg-zinc-900 border-b">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('**', '**')}><Bold className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('_', '_')}><Italic className="h-4 w-4" /></Button>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('## ')}><Heading2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('### ')}><Heading3 className="h-4 w-4" /></Button>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('[', '](url)')}><LinkIcon className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('`', '`')}><Code className="h-4 w-4" /></Button>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('- ')}><List className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertText('\n| Column 1 | Column 2 |\n| -------- | -------- |\n| Data 1   | Data 2   |\n')}><Table2 className="h-4 w-4" /></Button>
              
              <Button variant="ghost" size="sm" className="ml-auto sm:hidden" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-2" /> {showPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>
            <textarea
              ref={textareaRef}
              className="flex-1 w-full p-4 resize-none outline-none font-mono text-sm bg-transparent"
              placeholder="Write your article in Markdown..."
              value={form.content}
              onChange={e => setForm({...form, content: e.target.value})}
            />
          </div>
        </div>

        {(showPreview) && (
          <div className={cn("flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-zinc-950/50", !showPreview && "hidden lg:block")}>
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tight mb-8">{form.title || 'Untitled Article'}</h1>
              <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-m-20 prose-a:text-[#E8400C] prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown>{form.content || '*Preview will appear here...*'}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
