import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeamClient } from "./team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const supabase = await createClient();

  // Validate admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch team members
  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch invites
  const { data: invites } = await supabase
    .from("team_invites")
    .select(`
      *,
      profiles:invited_by (full_name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <TeamClient 
      initialMembers={members || []} 
      initialInvites={invites || []} 
      currentUserId={user.id} 
    />
  );
}
