"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Users, Kanban, Briefcase, Search } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";

export function CommandPalette() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ kb: any[], clients: any[] }>({ kb: [], clients: [] });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults({ kb: [], clients: [] });
        return;
      }

      const [kbRes, clientRes] = await Promise.all([
        supabase.from('kb_articles').select('id, title, slug').ilike('title', `%${query}%`).limit(5),
        supabase.from('clients').select('id, company_name').ilike('company_name', `%${query}%`).limit(5)
      ]);

      setResults({
        kb: kbRes.data || [],
        clients: clientRes.data || []
      });
    };

    const timer = setTimeout(fetchResults, 200);
    return () => clearTimeout(timer);
  }, [query, supabase]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search anything... (Cmd+K)" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {results.kb.length > 0 && (
          <CommandGroup heading="Knowledge Base">
            {results.kb.map((article) => (
              <CommandItem key={article.id} value={article.title} onSelect={() => runCommand(() => router.push(`/kb/article/${article.slug}`))}>
                <FileText className="mr-2 h-4 w-4" />
                {article.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.clients.length > 0 && (
          <CommandGroup heading="Clients">
            {results.clients.map((client) => (
              <CommandItem key={client.id} value={client.company_name} onSelect={() => runCommand(() => router.push(`/clients/${client.id}`))}>
                <Users className="mr-2 h-4 w-4" />
                {client.company_name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Quick Links">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <Briefcase className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/pipeline"))}>
            <Kanban className="mr-2 h-4 w-4" /> Pipeline
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/kb"))}>
            <FileText className="mr-2 h-4 w-4" /> Knowledge Base
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
