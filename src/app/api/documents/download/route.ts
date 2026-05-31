import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data: doc } = await supabase
      .from("documents").select("*").eq("id", id).single();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: signedUrl } = await serviceClient.storage
      .from("hisako-documents")
      .createSignedUrl(doc.storage_path, 60);

    if (!signedUrl?.signedUrl) {
      return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
    }

    return NextResponse.redirect(signedUrl.signedUrl);
  } catch (err: any) {
    console.error("Download route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
