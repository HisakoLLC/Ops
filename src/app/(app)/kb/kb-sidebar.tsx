"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Search, Plus, GitBranch, Users, FileText, UserCheck, Code2, Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ICONS: Record<string, any> = {
  BookOpen, GitBranch, Users, FileText, UserCheck, Code2, Layers
};

export function KBSidebar({ categories: initialCategories, isAdmin }: { categories: any[], isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', icon: 'BookOpen' });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSaveCategory = async () => {
    if (!newCat.name) return toast.error("Name is required");
    
    const { data, error } = await supabase
      .from('kb_categories')
      .insert([{ name: newCat.name, icon: newCat.icon, sort_order: categories.length + 1 }])
      .select()
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Category created");
      setCategories([...categories, { ...data, articleCount: 0 }]);
      setIsModalOpen(false);
      setNewCat({ name: '', icon: 'BookOpen' });
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      router.push(`/kb?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className={cn("border-r bg-white dark:bg-zinc-950 flex flex-col h-full transition-all duration-300", isCollapsed ? "w-[68px]" : "w-[260px]")}>
      <div className={cn("p-4 border-b flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && <span className="font-semibold text-sm">KB Navigation</span>}
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8 text-zinc-500">
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      {!isCollapsed && (
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search KB..." 
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <Link 
            href="/kb" 
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === '/kb' ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50",
              isCollapsed ? "justify-center" : "justify-between"
            )}
            title={isCollapsed ? "All Articles" : undefined}
          >
            <div className="flex items-center gap-3">
              <Layers className={cn("h-4 w-4", pathname === '/kb' ? "text-[#E8400C]" : "text-zinc-500")} />
              {!isCollapsed && "All Articles"}
            </div>
            {!isCollapsed && <span className="text-xs text-zinc-500">{categories.reduce((a, c) => a + c.articleCount, 0)}</span>}
          </Link>
        </div>

        <div className="px-3 py-2">
          {!isCollapsed && <h4 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Categories</h4>}
          <div className="space-y-1">
            {categories.map((c) => {
              const Icon = ICONS[c.icon] || BookOpen;
              const isActive = pathname === `/kb/category/${c.id}`;
              return (
                <Link 
                  key={c.id} 
                  href={`/kb/category/${c.id}`}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive ? "bg-zinc-100 dark:bg-zinc-900 text-[#E8400C]" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50",
                    isCollapsed ? "justify-center" : "justify-between"
                  )}
                  title={isCollapsed ? c.name : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", isActive ? "text-[#E8400C]" : "text-zinc-500")} />
                    {!isCollapsed && c.name}
                  </div>
                  {!isCollapsed && <span className="text-xs text-zinc-500">{c.articleCount}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="p-4 border-t">
          <Button variant="ghost" className={cn("w-full text-zinc-500", isCollapsed ? "justify-center px-0" : "justify-start")} onClick={() => setIsModalOpen(true)} title={isCollapsed ? "New Category" : undefined}>
            <Plus className={cn("h-4 w-4", !isCollapsed && "mr-2")} /> {!isCollapsed && "New Category"}
          </Button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
            <DialogDescription>Add a new category to the knowledge base.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} placeholder="e.g. Sales Scripts" />
            </div>
            <div className="grid gap-2">
              <Label>Icon</Label>
              <Select value={newCat.icon} onValueChange={v => setNewCat({...newCat, icon: v ?? ''})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(ICONS).map(k => {
                    const IconComp = ICONS[k];
                    return (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                          <IconComp className="h-4 w-4 text-zinc-500" /> {k}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90" onClick={handleSaveCategory}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
