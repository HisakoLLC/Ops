import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/lib/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { TopBar } from "@/components/top-bar";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { Profile } from "@/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Edge case where auth.users exists but profile doesn't (yet)
    // The handle_new_user trigger should prevent this, but just in case
    // We could either redirect or show an error. Let's redirect for now.
    // redirect("/login"); 
  }

  return (
    <AuthProvider user={user} profile={profile as Profile}>
      <KeyboardShortcuts />
      <CommandPalette />
      <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
