"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormWrapper } from "./FormWrapper";

const formSchema = z.object({
  manual_process_description: z.string().min(1, "Description is required"),
  people_count: z.string().optional(),
  hours_per_week: z.string().optional(),
  consequence_of_failure: z.string().optional(),
  previous_attempts: z.string().optional(),
  tools_crm: z.string().optional(),
  tools_email: z.string().optional(),
  tools_calendar: z.string().optional(),
  tools_pm: z.string().optional(),
  tools_spreadsheets: z.string().optional(),
  tools_database: z.string().optional(),
  tools_comms: z.string().optional(),
  tools_custom: z.string().optional(),
  success_definition: z.string().optional(),
  success_metrics: z.string().optional(),
  must_stay_manual: z.string().optional(),
  compliance_requirements: z.string().optional(),
  desired_live_date: z.string().optional(),
  timeline_flexible: z.string().optional(),
  budget_range: z.string().optional(),
  open_to_retainer: z.string().optional(),
  budget_approver: z.string().optional(),
  additional_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function IntakeQuestionnaireForm({ client, existingData, documentId, docLabel }: any) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      manual_process_description: existingData?.manual_process_description || "",
      people_count: existingData?.people_count || "",
      hours_per_week: existingData?.hours_per_week || "",
      consequence_of_failure: existingData?.consequence_of_failure || "",
      previous_attempts: existingData?.previous_attempts || "",
      tools_crm: existingData?.tools_crm || "",
      tools_email: existingData?.tools_email || "",
      tools_calendar: existingData?.tools_calendar || "",
      tools_pm: existingData?.tools_pm || "",
      tools_spreadsheets: existingData?.tools_spreadsheets || "",
      tools_database: existingData?.tools_database || "",
      tools_comms: existingData?.tools_comms || "",
      tools_custom: existingData?.tools_custom || "",
      success_definition: existingData?.success_definition || "",
      success_metrics: existingData?.success_metrics || "",
      must_stay_manual: existingData?.must_stay_manual || "",
      compliance_requirements: existingData?.compliance_requirements || "",
      desired_live_date: existingData?.desired_live_date || "",
      timeline_flexible: existingData?.timeline_flexible || "Yes",
      budget_range: existingData?.budget_range || "$5,000 – $15,000",
      open_to_retainer: existingData?.open_to_retainer || "Maybe",
      budget_approver: existingData?.budget_approver || "",
      additional_notes: existingData?.additional_notes || "",
    },
  });

  const onSubmitHandler = async () => {
    const isValid = await form.trigger();
    if (!isValid) return null;
    return form.getValues();
  };

  return (
    <FormWrapper
      clientId={client.id}
      docType="intake_questionnaire"
      docLabel={docLabel || "Intake Questionnaire"}
      documentId={documentId}
      onSubmit={onSubmitHandler}
    >
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Process Mapping</div>
              <FormField control={form.control} name="manual_process_description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Manual Process Description *</FormLabel>
                  <FormControl><Textarea rows={5} placeholder="Describe the manual steps..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="people_count" render={({ field }) => (
                  <FormItem>
                    <FormLabel>People Involved</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="hours_per_week" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours Per Week</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="consequence_of_failure" render={({ field }) => (
                <FormItem>
                  <FormLabel>Consequence of Failure</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="What goes wrong if this fails?" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="previous_attempts" render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Attempts</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="What has been tried?" {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Tools & Integrations</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="tools_crm" render={({ field }) => (
                  <FormItem><FormLabel>CRM Tool</FormLabel><FormControl><Input placeholder="e.g. HubSpot" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="tools_email" render={({ field }) => (
                  <FormItem><FormLabel>Email Provider</FormLabel><FormControl><Input placeholder="e.g. Google Workspace" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="tools_calendar" render={({ field }) => (
                  <FormItem><FormLabel>Calendar System</FormLabel><FormControl><Input placeholder="e.g. Google Calendar" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="tools_pm" render={({ field }) => (
                  <FormItem><FormLabel>Project Management</FormLabel><FormControl><Input placeholder="e.g. ClickUp" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="tools_spreadsheets" render={({ field }) => (
                  <FormItem><FormLabel>Spreadsheets</FormLabel><FormControl><Input placeholder="e.g. Excel / Google Sheets" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="tools_database" render={({ field }) => (
                  <FormItem><FormLabel>Databases</FormLabel><FormControl><Input placeholder="e.g. PostgreSQL" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="tools_comms" render={({ field }) => (
                  <FormItem><FormLabel>Communication</FormLabel><FormControl><Input placeholder="e.g. Slack / Teams" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="tools_custom" render={({ field }) => (
                  <FormItem><FormLabel>Custom APIs / Other Tools</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Success Definition & Compliance</div>
              <FormField control={form.control} name="success_definition" render={({ field }) => (
                <FormItem>
                  <FormLabel>Success Definition</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="How is success defined?" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="success_metrics" render={({ field }) => (
                <FormItem>
                  <FormLabel>Success Metrics</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="e.g. 100% accuracy, <5min SLA" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="must_stay_manual" render={({ field }) => (
                <FormItem>
                  <FormLabel>Must Stay Manual</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Any parts that MUST remain manual?" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="compliance_requirements" render={({ field }) => (
                <FormItem>
                  <FormLabel>Compliance / Security Requirements</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="e.g. GDPR, HIPAA, local regulations" {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Budget & Timeline</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="desired_live_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Live Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="timeline_flexible" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Is Timeline Flexible?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Somewhat">Somewhat</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="budget_range" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Range</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="open_to_retainer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Open to Retainer?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Maybe">Maybe</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="budget_approver" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Approver / Decision Maker</FormLabel>
                    <FormControl><Input placeholder="Name and title" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="additional_notes" render={({ field }) => (
                <FormItem className="pt-2">
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl><Textarea rows={4} {...field} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </form>
      </Form>
    </FormWrapper>
);
}
