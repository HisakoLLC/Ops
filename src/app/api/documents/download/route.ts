import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get document path
    const { data: document, error } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (error || !document || !document.storage_path) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Generate signed URL (60 seconds)
    const { data, error: signedUrlError } = await supabase.storage
      .from("hisako-documents")
      .createSignedUrl(document.storage_path, 60);

    if (signedUrlError || !data?.signedUrl) {
      return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
    }

    // Redirect to the signed URL
    return NextResponse.redirect(data.signedUrl);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
