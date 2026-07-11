import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await context.params;

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const serverSupabase = await createClient();
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if caller is admin
    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Cannot remove your own account" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseKey);

    // Delete user from auth.users (cascades to profiles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Member removed successfully" });
  } catch (error: any) {
    console.error("Delete Member API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await context.params;
    const { action } = await req.json();

    if (action !== "reset_password") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const serverSupabase = await createClient();
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if caller is admin
    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseKey);

    // Get target user email
    const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (getUserError || !targetUser.user?.email) {
      return NextResponse.json({ error: "Target user or email not found" }, { status: 404 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(targetUser.user.email, {
      redirectTo: `${origin}/auth/confirm?type=recovery`,
    });

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Password reset email sent to ${targetUser.user.email}` });
  } catch (error: any) {
    console.error("Reset Password API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
