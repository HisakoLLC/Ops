"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useUser } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROUTE_MAP: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/clients": "Clients",
  "/pipeline": "Pipeline",
  "/finance": "Finance",
  "/team": "Team",
  "/settings": "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const { profile } = useUser();

  // Basic logic to get title from pathname
  let pageTitle = "Hisako Ops";
  for (const [route, name] of Object.entries(ROUTE_MAP)) {
    if (pathname.startsWith(route)) {
      pageTitle = name;
      break;
    }
  }

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
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 relative">
          <Bell className="h-5 w-5" />
          {/* Mock notification dot */}
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#E8400C]"></span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center outline-none rounded-full">
              <Avatar className="h-8 w-8 border border-zinc-200 cursor-pointer dark:border-zinc-800">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                  {getInitials(profile?.full_name || null)}
                </AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Profile</DropdownMenuItem>
            <DropdownMenuItem disabled>Preferences</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
