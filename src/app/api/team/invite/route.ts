import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Missing email or role" }, { status: 400 });
    }

    // Initialize server client to read cookies and get the user
    const serverSupabase = await createClient();
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // Use service role to invite user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseKey);

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // Insert into team_invites table
    const { error: dbError } = await serverSupabase
      .from("team_invites")
      .insert([{
        email,
        role,
        invited_by: user.id
      }]);

    if (dbError) {
      // It's possible the invite was sent but DB insert failed. 
      // We return success but log error.
      console.error("Failed to insert team invite record:", dbError);
    }

    return NextResponse.json({ success: true, message: `Invite sent to ${email}` });

  } catch (error: any) {
    console.error("Invite API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
