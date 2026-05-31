import { createClient } from "@/lib/supabase/server";
import { buildDocument } from "@/lib/documents";
import { Packer } from "docx";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clientId, docType, formData, docLabel, documentId } = await req.json();
    if (!clientId || !docType || !formData || !docLabel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Normalize docType to use underscores for database and builder consistency
    const normalizedDocType = docType.replace(/-/g, "_");

    // Fetch client + settings
    const [{ data: client }, { data: settings }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("settings").select("*").eq("id", 1).single(),
    ]);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    // Merge all data — settings < client < formData (formData wins)
    const mergedData = {
      ...(settings || {}),
      ...client,
      ...formData,
      clientRef: client.ref,
      clientCompany: client.company_name,
      clientContact: client.contact_name,
      clientEmail: client.contact_email,
    };

    // Generate document
    let buffer: Buffer;
    try {
      const doc = buildDocument(normalizedDocType, mergedData);
      buffer = await Packer.toBuffer(doc);
    } catch (e: any) {
      console.error("Document generation error:", e);
      return NextResponse.json({ error: "Generation failed", detail: e.message }, { status: 500 });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const slug = docLabel.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const storagePath = `documents/${clientId}/${normalizedDocType}/${timestamp}_${slug}.docx`;

    // Use service role for storage (bypasses RLS)
    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: uploadError } = await serviceClient.storage
      .from("hisako-documents")
      .upload(storagePath, buffer, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Storage failed" }, { status: 500 });
    }

    // Save/update document record
    const docRecord = {
      client_id: clientId,
      created_by: user.id,
      doc_type: normalizedDocType,
      doc_label: docLabel,
      form_data: formData,
      storage_path: storagePath,
      version: 1,
    };

    let savedDoc;
    if (documentId) {
      // Regenerating existing doc — increment version
      const { data: existing } = await supabase
        .from("documents").select("version").eq("id", documentId).single();
      const { data } = await supabase
        .from("documents")
        .update({ ...docRecord, version: (existing?.version || 1) + 1, updated_at: new Date().toISOString() })
        .eq("id", documentId).select().single();
      savedDoc = data;
    } else {
      const { data } = await supabase
        .from("documents").insert(docRecord).select().single();
      savedDoc = data;
    }

    // Log activity on client
    await supabase.from("activities").insert({
      client_id: clientId,
      created_by: user.id,
      type: "document_generated",
      title: `Document generated: ${docLabel}`,
      metadata: { doc_type: normalizedDocType, document_id: savedDoc?.id },
    });

    return NextResponse.json({
      success: true,
      documentId: savedDoc?.id,
      storagePath,
    });
  } catch (err: any) {
    console.error("Failed POST route generate doc:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
