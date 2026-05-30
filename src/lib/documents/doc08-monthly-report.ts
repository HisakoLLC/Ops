import { Document } from "docx";
import { h1, h2, h3, p, kv, rule, table, cell } from "./helpers";

export function buildMonthlyReport(data: Record<string, any>): Document {
  return new Document({
    sections: [
      {
        children: [
          h1("MONTHLY PERFORMANCE REPORT"),
          rule(),
          p(`Prepared for: ${data.company_name ?? "[NOT PROVIDED]"}`),
          p(`Reporting Period: ${data.report_month} ${data.report_year}`),
          
          h2("1. Executive Summary"),
          p(data.executive_summary || "Operations ran smoothly over the reporting period. All key metrics remained within target thresholds."),
          
          h2("2. Key Metrics"),
          kv("Total Executions", data.total_executions),
          kv("Successful Runs", data.successful_runs),
          kv("Failed Runs", data.failed_runs),
          kv("Success Rate", `${data.success_rate}%`),
          kv("Avg. Execution Time", data.avg_execution_time),
          kv("Records Processed", data.records_processed),
          
          h2("3. Value Delivered"),
          kv("Hours Saved (Est)", data.hours_saved),
          kv("Tasks Eliminated", data.tasks_eliminated),
          
          h2("4. Incidents & Resolutions"),
          ...(data.incidents?.length ? [
            table(
              data.incidents.map((i: any) => ({
                children: [cell(i.date), cell(i.severity), cell(i.description), cell(i.resolution)]
              }))
            )
          ] : [p("No incidents reported during this period.")]),
          
          h2("5. Optimisations Deployed"),
          ...(data.optimisations?.length ? [
            table(
              data.optimisations.map((o: any) => ({
                children: [cell(o.change), cell(o.impact)]
              }))
            )
          ] : [p("No structural changes deployed this period.")]),
          
          h2("6. Look Ahead"),
          p("Planned for next month:"),
          p(data.planned_next_month || "Standard monitoring and maintenance."),
          
          h2("7. Commercial Summary"),
          kv("Monthly Retainer", `$${data.retainer_amount}`),
          kv("n8n License/Cloud", `$${data.n8n_cost}`),
          kv("3rd Party API Costs", `$${data.api_cost}`),
          
          rule(),
          p(`Next scheduled review: ${data.next_report_date || "To be confirmed"}`),
        ],
      },
    ],
  });
}
