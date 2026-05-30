import { Document } from "docx";
import { h1, h2, p, kv, rule } from "./helpers";

export function buildIntakeQuestionnaire(data: Record<string, any>): Document {
  return new Document({
    sections: [
      {
        children: [
          h1("INTAKE QUESTIONNAIRE & REQUIREMENTS"),
          rule(),
          kv("Client", data.company_name),
          kv("Date", new Date().toLocaleDateString()),
          
          h2("1. Process Description"),
          p(data.manual_process_description || "[NOT PROVIDED]"),
          kv("People Count", data.people_count),
          kv("Hours per Week", data.hours_per_week),
          
          h2("2. Impact & History"),
          p("Consequence of Failure:"),
          p(data.consequence_of_failure || "N/A"),
          p("Previous Attempts to Automate:"),
          p(data.previous_attempts || "N/A"),
          
          h2("3. Systems Environment"),
          kv("CRM", data.tools_crm),
          kv("Email", data.tools_email),
          kv("Calendar", data.tools_calendar),
          kv("Project Management", data.tools_pm),
          kv("Spreadsheets", data.tools_spreadsheets),
          kv("Database", data.tools_database),
          kv("Comms", data.tools_comms),
          kv("Custom/Other", data.tools_custom),
          
          h2("4. Success Criteria"),
          kv("Success Definition", data.success_definition),
          kv("Metrics", data.success_metrics),
          kv("Must Stay Manual?", data.must_stay_manual),
          kv("Compliance Requirements", data.compliance_requirements),
          
          h2("5. Logistics"),
          kv("Desired Live Date", data.desired_live_date),
          kv("Timeline Flexible?", data.timeline_flexible),
          kv("Budget Range", data.budget_range),
          kv("Open to Retainer?", data.open_to_retainer),
          kv("Budget Approver", data.budget_approver),
          
          h2("Additional Notes"),
          p(data.additional_notes || "None"),
        ],
      },
    ],
  });
}
