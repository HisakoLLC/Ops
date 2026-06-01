import { createClient } from "@/lib/supabase/server";
import { buildDocument } from "@/lib/documents";
import { Packer } from "docx";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });

    const format = req.nextUrl.searchParams.get("format") || "pdf";

    // Fetch the invoice
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, clients(company_name, contact_name, contact_email)")
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Prepare data for the document builder
    const mergedData = {
      invoice_ref: invoice.invoice_ref,
      client_name: invoice.clients?.company_name || "[Client Name]",
      issued_date: invoice.issued_date,
      due_date: invoice.due_date,
      status: invoice.status,
      amount: invoice.amount,
      line_items: invoice.line_items || [],
    };

    // Generate DOCX
    const doc = buildDocument("invoice", mergedData);
    const docxBuffer = await Packer.toBuffer(doc);

    if (format === "docx") {
      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${invoice.invoice_ref || 'invoice'}.docx"`,
        },
      });
    }

    // Generate PDF via Gotenberg
    try {
      const formData = new FormData();
      formData.append("files", new Blob([new Uint8Array(docxBuffer)]), "invoice.docx");

      const pdfResponse = await fetch("https://demo.gotenberg.dev/forms/libreoffice/convert", {
        method: "POST",
        body: formData,
      });

      if (!pdfResponse.ok) {
        throw new Error(`Gotenberg PDF conversion failed: ${pdfResponse.statusText}`);
      }

      const pdfArrayBuffer = await pdfResponse.arrayBuffer();
      const pdfBuffer = Buffer.from(pdfArrayBuffer);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoice.invoice_ref || 'invoice'}.pdf"`,
        },
      });
    } catch (e) {
      console.error("Gotenberg failed, falling back to DOCX:", e);
      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${invoice.invoice_ref || 'invoice'}.docx"`,
        },
      });
    }

  } catch (err: any) {
    console.error("Download invoice error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
