import { Document } from "docx";
import { h1, h2, h3, p, kv, rule, table, cell } from "./helpers";

export function buildPipelineHandover(data: Record<string, any>): Document {
  return new Document({
    sections: [
      {
        children: [
          h1("PIPELINE HANDOVER DOCUMENT"),
          rule(),
          p(`Prepared for: ${data.company_name ?? "[NOT PROVIDED]"}`),
          p(`Date: ${new Date().toLocaleDateString()}`),
          
          h2("1. Pipeline Overview"),
          kv("Pipeline Name", data.pipeline_name),
          p("What it does:"),
          p(data.what_it_does || "N/A"),
          p("Business Impact:"),
          p(data.business_impact || "N/A"),
          kv("Trigger", data.trigger_description),
          
          h2("2. Workflow Steps"),
          ...(data.steps || []).map((step: any) => p(`${step.step_number}. ${step.description}`)),
          
          h2("3. Systems & Access"),
          table(
            (data.tools_table || []).map((t: any) => ({
              children: [cell(t.tool), cell(t.role), cell(t.account_owner), cell(t.access_type)]
            }))
          ),
          
          h2("4. Monitoring & Maintenance"),
          kv("Monitoring Location", data.monitoring_location),
          kv("Healthy Volume", data.healthy_volume),
          kv("Error Alert Method", data.error_alert_method),
          
          h3("Common Issues"),
          ...(data.common_issues || []).map((issue: any) => 
            p(`• ${issue.symptom} -> Cause: ${issue.cause} -> Fix: ${issue.fix}`)
          ),
          
          h3("DO NOT CHANGE"),
          p(data.do_not_change_list || "None specified."),
          
          h2("5. Escalation & Support"),
          kv("Escalation Email", data.escalation_email),
          kv("Response Time", data.escalation_response_time),
          kv("Emergency Contact", data.escalation_emergency),
          
          h2("6. Sign-off"),
          kv("Monthly Review Date", data.monthly_review_date),
          kv("Delivery Date", data.delivery_date),
          kv("Bug Fix Warranty End", data.bug_fix_end_date),
          kv("Final Invoice Amount", data.final_invoice_amount),
          kv("Run Start Date", data.run_start_date),
        ],
      },
    ],
  });
}
