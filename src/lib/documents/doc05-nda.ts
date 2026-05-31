import { Document } from "docx";
import { h1, h2, p, buildSection, officialStamp, signatureBlock } from "./branded-helpers";

export function buildNDA(data: Record<string, any>): Document {
  return new Document({
    sections: [
      buildSection([
        h1("NON-DISCLOSURE AGREEMENT"),
        p(`This Non-Disclosure Agreement (the "Agreement") is entered into on ${data.nda_date ?? '[NOT PROVIDED]'} (the "Effective Date"), by and between:`, true),
        
        h2("Parties"),
        p("1. HISAKO TECHNOLOGIES, a company registered in the United Kingdom (the \"Disclosing Party\").", true),
        p(`2. ${data.recipient_company ?? '[NOT PROVIDED]'}, represented by ${data.recipient_name ?? '[NOT PROVIDED]'} (the "Receiving Party").`, true),
        
        h2("1. Purpose"),
        p(data.purpose_override || "The Receiving Party wishes to receive certain confidential information from the Disclosing Party for the purpose of evaluating a potential business relationship."),
        
        h2("2. Confidential Information"),
        p("Confidential Information means all non-public information disclosed by the Disclosing Party, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure."),
        
        h2("3. Obligations"),
        p("The Receiving Party agrees to: (a) protect the Confidential Information with the same degree of care it uses to protect its own confidential information of similar nature, but in no event less than reasonable care; (b) not use any Confidential Information for any purpose outside the scope of this Agreement; and (c) except as otherwise authorized by the Disclosing Party in writing, limit access to Confidential Information to those of its employees and contractors who need that access for purposes consistent with this Agreement and who have signed confidentiality agreements with the Receiving Party containing protections not materially less protective of the Confidential Information than those herein."),
        
        h2("4. Term"),
        p("This Agreement shall remain in effect for a period of two (2) years from the Effective Date."),
        
        p(""),
        officialStamp(),
        p(""),
        
        h2("Signatures"),
        p("IN WITNESS WHEREOF, the parties hereto have executed this Non-Disclosure Agreement as of the date first written above."),
        p(""),
        signatureBlock("Hisako Technologies", data.recipient_company ?? "Receiving Party"),
      ]),
    ],
  });
}
