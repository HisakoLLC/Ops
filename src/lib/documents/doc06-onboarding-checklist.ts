import { Document } from "docx";
import { h1, h2, p, kv, buildSection, officialStamp } from "./helpers";

export function buildOnboardingChecklist(data: Record<string, any>): Document {
  return new Document({
    sections: [
      buildSection([
        h1("ONBOARDING CHECKLIST"),
        kv("Client", data.company_name),
        kv("Project Name", data.project_name),
        kv("Kickoff Date", data.kickoff_date),
        kv("Project Manager", data.pm_name),
        
        h2("1. Communication Setup"),
        p(`Primary Channel: ${data.communication_channel || "Email"}`),
        
        h2("2. Tool Access Requirements"),
        p("The following system access is required to proceed:"),
        p(data.tool_access_list || "None listed."),
        
        h2("3. Checklist Status"),
        p("Current onboarding state snapshot:", true),
        ...(data.checklist_state ? Object.entries(data.checklist_state).map(([key, value]) => 
          p(`[${value ? 'X' : ' '}] ${key}`)
        ) : [p("No checklist items saved.")]),
        
        p(""),
        officialStamp(),
      ]),
    ],
  });
}
