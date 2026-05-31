import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { DocumentEmail } from "@/lib/email-templates/document-email";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await req.json();
    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    // Fetch the document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", doc.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!client.contact_email) {
      return NextResponse.json({ error: "Client does not have a contact email configured" }, { status: 400 });
    }

    // Initialize service client to download file and generate signed URL
    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create signed URL for download button (valid for 30 days)
    const { data: signedData, error: signedError } = await serviceClient.storage
      .from("hisako-documents")
      .createSignedUrl(doc.storage_path, 60 * 60 * 24 * 30);

    if (signedError || !signedData?.signedUrl) {
      console.error("Failed to generate signed URL:", signedError);
      return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await serviceClient.storage
      .from("hisako-documents")
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      console.error("Failed to download file from storage:", downloadError);
      return NextResponse.json({ error: "Failed to retrieve document file" }, { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Initialize Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY environment variable is not configured" }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    const fromEmail = process.env.RESEND_FROM || "noreply@notify.hisako.eu";
    const replyToEmail = process.env.RESEND_REPLY_TO || "hello@hisako.eu";
    const slug = doc.doc_label.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // Send email using Resend
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: `Hisako AI Agency <${fromEmail}>`,
      to: [client.contact_email],
      replyTo: replyToEmail,
      subject: `Hisako AI Agency - Your Document is Ready: ${doc.doc_label}`,
      react: DocumentEmail({
        clientName: client.contact_name || client.company_name,
        docLabel: doc.doc_label,
        downloadUrl: signedData.signedUrl,
      }),
      attachments: [
        {
          filename: `${slug}.docx`,
          content: fileBuffer,
        },
      ],
    });

    if (emailError) {
      console.error("Resend API error:", emailError);
      return NextResponse.json({ error: "Failed to send email via Resend", detail: emailError.message }, { status: 500 });
    }

    // Log email activity in DB
    await supabase.from("activities").insert({
      client_id: client.id,
      created_by: user.id,
      type: "email",
      title: `Sent document to client: ${doc.doc_label}`,
      body: `Emailed to ${client.contact_email} via Resend. ID: ${emailResponse?.id || "N/A"}.`,
      metadata: {
        document_id: doc.id,
        recipient: client.contact_email,
        resend_id: emailResponse?.id,
      },
    });

    return NextResponse.json({ success: true, message: "Email sent successfully", emailId: emailResponse?.id });
  } catch (err: any) {
    console.error("Critical error in sending document email:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
