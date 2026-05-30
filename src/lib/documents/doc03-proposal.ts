import { Document } from "docx";
import { h1, h2, h3, p, kv, rule, table, cell } from "./helpers";

export function buildProposal(data: Record<string, any>): Document {
  return new Document({
    sections: [
      {
        children: [
          h1("AUTOMATION PROPOSAL"),
          rule(),
          p(`Prepared for: ${data.company_name ?? "[NOT PROVIDED]"}`),
          p(`Date: ${new Date().toLocaleDateString()}`),
          
          h2("1. Executive Summary"),
          p("Based on our discovery, Hisako Technologies proposes the following automation architecture to streamline your operations."),
          kv("Pipeline Name", data.pipeline_name),
          p(data.pipeline_description || "[DESCRIPTION NOT PROVIDED]"),
          
          h2("2. Proposed Architecture"),
          ...(data.architecture_steps || []).map((step: any) => p(`${step.number}. ${step.description}`)),
          
          h3("Tools to be used:"),
          ...(data.tools_used || []).map((tool: string) => p(`• ${tool}`)),
          
          h2("3. Commercials"),
          kv("Build Fee", `$${data.build_fee ?? 0}`),
          kv("Monthly Retainer", `$${data.retainer_fee ?? 0}`),
          kv("Est. 3rd Party Costs", `$${data.third_party_cost_estimate ?? 0}/mo`),
          
          h2("4. Timeline"),
          kv("Kickoff Date", data.kickoff_date),
          kv("Process Mapping", data.map_duration),
          kv("Architecture Design", data.design_duration),
          kv("Build & Test", data.build_duration),
          kv("Total Timeline", data.total_timeline),
          kv("Target Go-Live", data.go_live_date),
          
          h2("5. Scope Details"),
          h3("Inclusions:"),
          p(data.custom_inclusions || "Standard platform setup and defined integrations."),
          h3("Exclusions:"),
          p(data.custom_exclusions || "Data cleaning, legacy system patching, hardware costs."),
          
          rule(),
          p(`This proposal is valid for ${data.valid_days || 30} days from the date of issue.`),
        ],
      },
    ],
  });
}
