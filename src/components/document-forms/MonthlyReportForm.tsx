"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormWrapper } from "./FormWrapper";

const formSchema = z.object({
  report_month: z.string().min(1, "Month is required"),
  report_year: z.coerce.number().min(2020).max(2100),
  executive_summary: z.string().min(1, "Summary is required"),
  total_executions: z.string().optional(),
  successful_runs: z.string().optional(),
  failed_runs: z.string().optional(),
  success_rate: z.string().optional(),
  avg_execution_time: z.string().optional(),
  records_processed: z.string().optional(),
  errors_resolved: z.string().optional(),
  hours_saved: z.string().optional(),
  tasks_eliminated: z.string().optional(),
  notable_output: z.string().optional(),
  incidents: z.array(z.object({
    date: z.string().optional(),
    severity: z.string().optional(),
    description: z.string().optional(),
    resolution: z.string().optional(),
    status: z.string().optional(),
  })).default([]),
  optimisations: z.string().optional(),
  planned_next_month: z.string().optional(),
  retainer_amount: z.coerce.number().optional(),
  n8n_cost: z.string().optional(),
  api_cost: z.string().optional(),
  next_report_date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function MonthlyReportForm({ client, existingData, documentId, docLabel }: any) {
  const currentMonthName = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const [noIncidents, setNoIncidents] = useState(
    existingData?.incidents && existingData.incidents.length === 0 ? true : false
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      report_month: existingData?.report_month || currentMonthName,
      report_year: existingData?.report_year || currentYear,
      executive_summary: existingData?.executive_summary || "",
      total_executions: existingData?.total_executions || "",
      successful_runs: existingData?.successful_runs || "",
      failed_runs: existingData?.failed_runs || "",
      success_rate: existingData?.success_rate || "",
      avg_execution_time: existingData?.avg_execution_time || "",
      records_processed: existingData?.records_processed || "",
      errors_resolved: existingData?.errors_resolved || "",
      hours_saved: existingData?.hours_saved || "",
      tasks_eliminated: existingData?.tasks_eliminated || "",
      notable_output: existingData?.notable_output || "",
      incidents: existingData?.incidents || [
        { date: "", severity: "Low", description: "", resolution: "", status: "Resolved" }
      ],
      optimisations: existingData?.optimisations || "",
      planned_next_month: existingData?.planned_next_month || "",
      retainer_amount: existingData?.retainer_amount || client.retainer_amount || 0,
      n8n_cost: existingData?.n8n_cost || "",
      api_cost: existingData?.api_cost || "",
      next_report_date: existingData?.next_report_date || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "incidents",
  });

  const onSubmitHandler = async () => {
    const isValid = await form.trigger();
    if (!isValid) return null;
    
    const values = form.getValues();
    return {
      ...values,
      incidents: noIncidents ? [] : values.incidents,
      clientCompany: client.company_name,
    };
  };

  return (
    <FormWrapper
      clientId={client.id}
      docType="monthly_report"
      docLabel={docLabel || "Monthly Report"}
      documentId={documentId}
      onSubmit={onSubmitHandler}
    >
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Report Period</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="report_month" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Month *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="report_year" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Year *</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="executive_summary" render={({ field }) => (
                <FormItem>
                  <FormLabel>Executive Summary *</FormLabel>
                  <FormControl><Textarea rows={4} placeholder="2-3 sentences summarizing the month..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">System Metrics</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="total_executions" render={({ field }) => (
                  <FormItem><FormLabel>Total Executions</FormLabel><FormControl><Input placeholder="e.g. 15,240" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="successful_runs" render={({ field }) => (
                  <FormItem><FormLabel>Successful Runs</FormLabel><FormControl><Input placeholder="e.g. 15,120" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="failed_runs" render={({ field }) => (
                  <FormItem><FormLabel>Failed Runs</FormLabel><FormControl><Input placeholder="e.g. 120" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="success_rate" render={({ field }) => (
                  <FormItem><FormLabel>Success Rate</FormLabel><FormControl><Input placeholder="e.g. 99.2%" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="avg_execution_time" render={({ field }) => (
                  <FormItem><FormLabel>Avg Execution Time</FormLabel><FormControl><Input placeholder="e.g. 1.4s" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="records_processed" render={({ field }) => (
                  <FormItem><FormLabel>Records Processed</FormLabel><FormControl><Input placeholder="e.g. 4,200 leads" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="errors_resolved" render={({ field }) => (
                  <FormItem><FormLabel>Errors Resolved</FormLabel><FormControl><Input placeholder="e.g. 3 manual retries" {...field} /></FormControl></FormItem>
                )} />
              </div>

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Business Value Metrics</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="hours_saved" render={({ field }) => (
                  <FormItem><FormLabel>Estimated Hours Saved</FormLabel><FormControl><Input placeholder="e.g. 24 hours" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="tasks_eliminated" render={({ field }) => (
                  <FormItem><FormLabel>Tasks Eliminated</FormLabel><FormControl><Input placeholder="e.g. Manual data entry" {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notable_output" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notable Outputs</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="e.g. Automated synchronization of CRM and accounting software..." {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2 flex items-center justify-between">
                <span>Incidents Log</span>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="no_incidents"
                    checked={noIncidents}
                    onCheckedChange={(checked) => setNoIncidents(!!checked)}
                  />
                  <label htmlFor="no_incidents" className="text-xs text-zinc-500 font-medium select-none cursor-pointer">
                    No incidents this month
                  </label>
                </div>
              </div>

              {!noIncidents && (
                <div className="space-y-4">
                  {fields.map((item, index) => (
                    <div key={item.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-zinc-500">Incident #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`incidents.${index}.date` as const}
                          render={({ field }) => (
                            <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`incidents.${index}.severity` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Severity</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`incidents.${index}.status` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="Resolved">Resolved</SelectItem>
                                  <SelectItem value="Open">Open</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`incidents.${index}.description` as const}
                        render={({ field }) => (
                          <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Symptom/problem..." {...field} /></FormControl></FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`incidents.${index}.resolution` as const}
                        render={({ field }) => (
                          <FormItem><FormLabel>Resolution</FormLabel><FormControl><Input placeholder="Root cause and fix..." {...field} /></FormControl></FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ date: "", severity: "Low", description: "", resolution: "", status: "Resolved" })}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Incident
                  </Button>
                </div>
              )}

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Optimisations & Planned Work</div>
              <FormField control={form.control} name="optimisations" render={({ field }) => (
                <FormItem>
                  <FormLabel>Optimisations Made</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="Change made &mdash; reason &mdash; impact (one per line)..." {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="planned_next_month" render={({ field }) => (
                <FormItem>
                  <FormLabel>Planned Work Next Month</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="List planned automations or steps..." {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Retainer & Infrastructure Costs</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="retainer_amount" render={({ field }) => (
                  <FormItem><FormLabel>Retainer Amount (USD) *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="n8n_cost" render={({ field }) => (
                  <FormItem><FormLabel>n8n/Make Cost This Month</FormLabel><FormControl><Input placeholder="e.g. $20/mo" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="api_cost" render={({ field }) => (
                  <FormItem><FormLabel>API Costs This Month</FormLabel><FormControl><Input placeholder="e.g. $12.50 OpenAI" {...field} /></FormControl></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="next_report_date" render={({ field }) => (
                <FormItem className="pt-2">
                  <FormLabel>Next Report Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </form>
      </Form>
    </FormWrapper>
);
}
