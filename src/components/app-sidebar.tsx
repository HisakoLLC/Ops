"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Kanban, Users2, Settings, LogOut, UserSearch, DollarSign, Database } from "lucide-react";
import { useUser } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/leads", label: "Leads", icon: UserSearch, adminOnly: false },
  { href: "/clients", label: "Clients", icon: Users, adminOnly: false },
  { href: "/pipeline", label: "Pipeline", icon: Kanban, adminOnly: false },
  { href: "/finance", label: "Finance", icon: DollarSign, adminOnly: true },
  { href: "/vendors", label: "Vendors", icon: Database, adminOnly: false },
  { href: "/team", label: "Team", icon: Users2, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: false },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUser();
  const supabase = createClient();

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
    <div className="flex h-full w-60 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          H
        </div>
        <span className="font-semibold tracking-tight text-sm">Hisako Ops</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="flex flex-col space-y-1 px-3">
          {navItems.map((item) => {
            if (item.adminOnly && profile?.role !== "admin") return null;

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
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-zinc-200 dark:border-zinc-800">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-xs">
              {getInitials(profile?.full_name || null)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium leading-none">
              {profile?.full_name || "User"}
            </span>
            <span className="mt-1 truncate text-xs text-zinc-500 capitalize dark:text-zinc-400">
              {profile?.role}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
