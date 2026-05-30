import { Document } from "docx";
import { h1, h2, p, kv, rule } from "./helpers";

export function buildAgreement(data: Record<string, any>): Document {
  return new Document({
    sections: [
      {
        children: [
          h1("MASTER SERVICES AGREEMENT"),
          rule(),
          p(`This Master Services Agreement is made on ${data.agreement_date || new Date().toLocaleDateString()}`),
          
          h2("Parties"),
          p("1. HISAKO TECHNOLOGIES"),
          p(`2. ${data.company_name ?? "[COMPANY NAME]"} ("Client"), located in ${data.client_country ?? "[COUNTRY]"}.`),
          
          h2("1. Services"),
          p("Provider agrees to perform the automation and operational services as detailed in individual Statements of Work or Proposals mutually agreed upon by the parties."),
          
          h2("2. Compensation"),
          p("Client shall pay Provider the fees set forth in the applicable Proposal. Invoices are due within 14 days of receipt."),
          
          h2("3. Confidentiality"),
          p("Both parties agree to maintain the confidentiality of all proprietary information disclosed during the term of this Agreement."),
          
          h2("4. Custom Clauses"),
          p(data.custom_clauses || "None specified."),
          
          rule(),
          h2("Signatures"),
          kv("Hisako Technologies", "___________________________"),
          kv(data.company_name ?? "[COMPANY]", "___________________________"),
        ],
      },
    ],
  });
}
