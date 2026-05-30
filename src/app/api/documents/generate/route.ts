import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { Packer } from "docx";
import { buildDocument } from "@/lib/documents";

export async function POST(req: Request) {
  try {
    const { clientId, docType, formData, docLabel, documentId } = await req.json();

    if (!clientId || !docType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Initialize server client to read cookies and get the user
    const serverSupabase = await createClient();
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // We must use service role to bypass RLS for server-side generation if needed
    // Let's use service role for storage reliability as requested by prompt.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createSupabaseClient<any>(supabaseUrl, supabaseKey);

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch settings (assume id = 1 or grab first)
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .single();

    // Merge data
    const mergedData = { ...settings, ...client, ...formData };

    // Build document
    const doc = buildDocument(docType, mergedData);
    
    // Generate Buffer
    const buffer = await Packer.toBuffer(doc);

    // Upload to Storage
    const safeLabel = (docLabel || docType).toLowerCase().replace(/[^a-z0-9]/g, "-");
    const fileName = `${Date.now()}_${safeLabel}.docx`;
    const filePath = `${clientId}/${docType}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("hisako-documents")
      .upload(filePath, buffer, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }

    // Upsert document record
    const documentData = {
      client_id: clientId,
      doc_type: docType,
      doc_label: docLabel || docType,
      storage_path: filePath,
      form_data: formData,
      created_by: user.id,
      version: 1, // simplified versioning
    };

    let upsertedDocId = documentId;

    if (documentId) {
      // If updating
      const { data: existing } = await supabase.from("documents").select("version").eq("id", documentId).single();
      documentData.version = (existing?.version || 0) + 1;
      
      const { error: updateError } = await supabase
        .from("documents")
        .update(documentData)
        .eq("id", documentId);
        
      if (updateError) throw updateError;
    } else {
      // If inserting
      const { data: inserted, error: insertError } = await supabase
        .from("documents")
        .insert([documentData])
        .select("id")
        .single();
        
      if (insertError) throw insertError;
      upsertedDocId = inserted.id;
    }

    // Insert activity record
    await supabase.from("activities").insert([{
      client_id: clientId,
      created_by: user.id,
      type: "document_generated",
      title: `Generated ${docLabel || docType}`,
      metadata: { document_id: upsertedDocId, doc_type: docType }
    }]);

    return NextResponse.json({ 
      success: true, 
      documentId: upsertedDocId 
    });

  } catch (error: any) {
    console.error("Generation API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
