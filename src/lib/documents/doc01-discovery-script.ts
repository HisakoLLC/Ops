import { Document } from "docx";
import { h1, h2, p, kv, buildSection, officialStamp, darkBand } from "./helpers";

export function buildDiscoveryScript(data: Record<string, any>): Document {
  return new Document({
    sections: [
      buildSection([
        h1("DISCOVERY CALL SCRIPT & NOTES"),
        kv("Client / Company", data.company_name),
        kv("Contact Name", data.contact_name),
        kv("Call Date", data.call_date),
        
        h2("1. The Pain Point"),
        darkBand("WHAT IS THE MANUAL PROCESS CAUSING Friction?"),
        p(data.pain_point_notes || "N/A"),
        kv("Hours Affected (approx.)", data.hours_affected),
        
        h2("2. Current Tool Stack"),
        darkBand("WHAT SOFTWARE IS INVOLVED IN THIS PROCESS?"),
        p(data.tool_stack_notes || "N/A"),
        
        h2("3. Business Context"),
        kv("Timeline / Urgency", data.timeline),
        kv("Budget Signal", data.budget_signal),
        
        h2("4. Qualification Scoring (1-5)"),
        kv("Pain Clarity", data.scoring_pain_clarity),
        kv("Process Repeatability", data.scoring_repeatability),
        kv("Budget Match", data.scoring_budget),
        kv("Decision Authority", data.scoring_authority),
        kv("Timeline Match", data.scoring_timeline),
        kv("Tool Stack Viability", data.scoring_stack),
        
        h2("5. Overall Assessment"),
        darkBand("OVERALL ASSESSMENT NOTES"),
        p(data.overall_assessment || "N/A"),
        kv("Proceed to Proposal?", data.proceed),
        
        p(""),
        officialStamp(),
      ]),
    ],
  });
}
