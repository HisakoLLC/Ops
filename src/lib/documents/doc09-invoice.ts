import { Document } from "docx";
import { h1, h2, p, kv, buildSection, officialStamp, table, row, cell, callout } from "./branded-helpers";

export function buildInvoice(data: Record<string, any>): Document {
  const lineItems = data.line_items || [];
  const totalAmount = data.amount || 0;

  return new Document({
    sections: [
      buildSection([
        h1("INVOICE"),
        kv("Invoice Ref", data.invoice_ref || "DRAFT"),
        kv("Issued Date", data.issued_date || "[NOT PROVIDED]"),
        kv("Due Date", data.due_date || "[NOT PROVIDED]"),
        kv("Status", (data.status || "draft").toUpperCase()),
        
        h2("Billed To"),
        p(data.client_name || "[Client Name]", true),
        
        h2("Line Items"),
        ...(lineItems.length ? [
          table([
            row([cell("Description", true), cell("Amount", true)]),
            ...lineItems.map((item: any) => row([
              cell(item.description || ""),
              cell(`$${Number(item.amount || 0).toFixed(2)}`)
            ])),
            row([cell("TOTAL", true), cell(`$${Number(totalAmount).toFixed(2)}`, true)])
          ])
        ] : [p("No line items specified.")]),

        h2("Payment Terms"),
        p("Due upon receipt unless otherwise stated."),
        
        h2("Bank Details"),
        callout("[ADD YOUR PAYMENT DETAILS]"),
        
        p(""),
        p("Thank you for your business!", true),
        p(""),
        officialStamp()
      ]),
    ],
  });
}
