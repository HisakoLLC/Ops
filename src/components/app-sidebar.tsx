"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Users2,
  Settings,
  LogOut,
  UserSearch,
  DollarSign,
  Database,
  Briefcase,
  Clock,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Tags,
  FolderTree,
  Mail,
  ChevronDown
} from "lucide-react";
import { useUser } from "@/lib/auth-context";
import { useRole } from "@/lib/use-role";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface GroupItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  hasBadge?: boolean;
}

interface Group {
  title: string;
  isCollapsible?: boolean;
  items: GroupItem[];
}

const groups: Group[] = [
  {
    title: "MAIN",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['admin', 'editor', 'writer', 'member', 'viewer'] },
      { href: "/kb", label: "Knowledge Base", icon: BookOpen, roles: ['admin', 'editor', 'writer', 'member', 'viewer'] },
    ]
  },
  {
    title: "SALES",
    items: [
      { href: "/leads", label: "Leads", icon: UserSearch, roles: ['admin', 'editor', 'writer', 'member'] },
      { href: "/clients", label: "Clients", icon: Users, roles: ['admin', 'editor', 'writer', 'member'] },
      { href: "/pipeline", label: "Pipeline", icon: Kanban, roles: ['admin', 'editor', 'writer', 'member'] },
    ]
  },
  {
    title: "DELIVERY",
    items: [
      { href: "/projects", label: "Projects", icon: Briefcase, roles: ['admin', 'editor', 'writer', 'member'] },
      { href: "/time", label: "Time", icon: Clock, roles: ['admin', 'editor', 'writer', 'member'] },
    ]
  },
  {
    title: "BUSINESS",
    items: [
      { href: "/finance", label: "Finance", icon: DollarSign, roles: ['admin'] },
      { href: "/vendors", label: "Vendors", icon: Database, roles: ['admin', 'editor', 'writer', 'member'] },
    ]
  },
  {
    title: "CMS",
    isCollapsible: true,
    items: [
      { href: "/docs", label: "All Docs", icon: BookOpen, roles: ['admin', 'editor', 'writer', 'member'] },
      { href: "/docs/new", label: "New Doc", icon: FileText, roles: ['admin', 'editor', 'writer', 'member'] },
      { href: "/cms/media", label: "Media Library", icon: ImageIcon, roles: ['admin', 'editor', 'writer'] },
      { href: "/cms/categories", label: "Categories", icon: FolderOpen, roles: ['admin', 'editor'] },
      { href: "/cms/tags", label: "Tags", icon: Tags, roles: ['admin', 'editor'] },
      { href: "/cms/navigation", label: "Navigation", icon: FolderTree, roles: ['admin', 'editor'] },
      { href: "/cms/forms", label: "Forms", icon: Mail, roles: ['admin', 'editor'], hasBadge: true },
    ]
  },
  {
    title: "TEAM",
    items: [
      { href: "/team", label: "Team", icon: Users2, roles: ['admin'] },
      { href: "/settings", label: "Settings", icon: Settings, roles: ['admin', 'editor', 'writer', 'member'] },
    ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUser();
  const { role } = useRole();
  const supabase = createClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newFormsCount, setNewFormsCount] = useState(0);

  useEffect(() => {
    async function fetchNewFormsCount() {
      try {
        const { count, error } = await supabase
          .from('form_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new');
        if (!error && count !== null) {
          setNewFormsCount(count);
        }
      } catch (err) {
        console.error("Error fetching form submissions count:", err);
      }
    }
    fetchNewFormsCount();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex h-full flex-col border-r border-zinc-200 bg-zinc-50 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950 ${isCollapsed ? "w-[68px]" : "w-60"}`}>
      <div className={`flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800 ${isCollapsed ? "justify-center" : "px-6 justify-between"}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
              H
            </div>
            <span className="font-semibold tracking-tight text-sm whitespace-nowrap">Hisako Ops</span>
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="flex flex-col space-y-4 px-3">
          {groups.map((group) => {
            const visibleItems = group.items.filter(item => item.roles.includes(role || 'viewer'));
            if (visibleItems.length === 0) return null;

            if (group.isCollapsible) {
              const isCMSRoute = pathname.startsWith('/cms') || pathname.startsWith('/docs');
              
              if (isCollapsed) {
                return (
                  <div key={group.title} className="flex flex-col space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-zinc-200/50 text-zinc-900 border-l-2 border-[#E8400C] dark:bg-zinc-800/50 dark:text-zinc-50"
                              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                          } justify-center border-l-0`}
                          title={item.label}
                        >
                          <div className="relative">
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {item.hasBadge && newFormsCount > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-red-600" />
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              return (
                <Collapsible key={group.title} defaultOpen={isCMSRoute} className="space-y-1">
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
                    <span>{group.title}</span>
                    <ChevronDown className="h-3 w-3 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-zinc-200/50 text-zinc-900 border-l-2 border-[#E8400C] dark:bg-zinc-800/50 dark:text-zinc-50"
                              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                          }`}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap flex-1">{item.label}</span>
                          {item.hasBadge && newFormsCount > 0 && (
                            <span className="inline-flex items-center justify-center bg-red-600 text-white rounded-full px-2 py-0.5 text-[10px] font-bold min-w-5 h-5">
                              {newFormsCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <div key={group.title} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
                    {group.title}
                  </div>
                )}
                <div className="flex flex-col space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-zinc-200/50 text-zinc-900 border-l-2 border-[#E8400C] dark:bg-zinc-800/50 dark:text-zinc-50"
                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                        } ${isCollapsed ? "justify-center border-l-0" : "gap-3"}`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className={`border-t border-zinc-200 p-4 dark:border-zinc-800 flex items-center ${isCollapsed ? "justify-center flex-col gap-4" : "gap-3"}`}>
        <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800 flex-shrink-0" title={isCollapsed ? profile?.full_name || "User" : undefined}>
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-xs">
            {getInitials(profile?.full_name || null)}
          </AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium leading-none">
              {profile?.full_name || "User"}
            </span>
            <span className="mt-1 truncate text-xs text-zinc-500 capitalize dark:text-zinc-400">
              {profile?.role}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
