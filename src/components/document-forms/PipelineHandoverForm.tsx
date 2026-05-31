"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormWrapper } from "./FormWrapper";

const formSchema = z.object({
  pipeline_name: z.string().min(1, "Pipeline name is required"),
  delivery_date: z.string().min(1, "Delivery date is required"),
  pm_name: z.string().min(1, "Delivered By is required"),
  what_it_does: z.string().min(1, "Description is required"),
  business_impact: z.string().optional(),
  trigger_description: z.string().min(1, "Trigger description is required"),
  pipeline_steps: z.array(z.object({
    step_label: z.string().min(1, "Step label is required"),
    step_description: z.string().min(1, "Step description is required"),
  })),
  tools_used: z.string().optional(),
  monitoring_location: z.string().optional(),
  error_alert_method: z.string().optional(),
  common_issues: z.string().optional(),
  do_not_change: z.string().optional(),
  escalation_email: z.string().email("Invalid email").optional().or(z.literal("")),
  escalation_response_time: z.string().optional(),
  escalation_emergency: z.string().optional(),
  monthly_review_date: z.string().optional(),
  bug_fix_end_date: z.string().optional(),
  run_start_date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function PipelineHandoverForm({ client, existingData, documentId, docLabel }: any) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      pipeline_name: existingData?.pipeline_name || "",
      delivery_date: existingData?.delivery_date || format(new Date(), "yyyy-MM-dd"),
      pm_name: existingData?.pm_name || "",
      what_it_does: existingData?.what_it_does || "",
      business_impact: existingData?.business_impact || "",
      trigger_description: existingData?.trigger_description || "",
      pipeline_steps: existingData?.pipeline_steps || [
        { step_label: "Step 1", step_description: "" },
        { step_label: "Step 2", step_description: "" },
        { step_label: "Step 3", step_description: "" },
      ],
      tools_used: existingData?.tools_used || "",
      monitoring_location: existingData?.monitoring_location || "",
      error_alert_method: existingData?.error_alert_method || "",
      common_issues: existingData?.common_issues || "",
      do_not_change: existingData?.do_not_change || "",
      escalation_email: existingData?.escalation_email || "hello@hisako.eu",
      escalation_response_time: existingData?.escalation_response_time || "4 business hours",
      escalation_emergency: existingData?.escalation_emergency || "",
      monthly_review_date: existingData?.monthly_review_date || "",
      bug_fix_end_date: existingData?.bug_fix_end_date || "",
      run_start_date: existingData?.run_start_date || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pipeline_steps",
  });

  const onSubmitHandler = async () => {
    const isValid = await form.trigger();
    if (!isValid) return null;
    return form.getValues();
  };

  return (
    <FormWrapper
      clientId={client.id}
      docType="pipeline_handover"
      docLabel={docLabel || "Pipeline Handover"}
      documentId={documentId}
      onSubmit={onSubmitHandler}
    >
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Handover Metadata</div>
              <FormField control={form.control} name="pipeline_name" render={({ field }) => (
                <FormItem><FormLabel>Pipeline Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="delivery_date" render={({ field }) => (
                  <FormItem><FormLabel>Delivery Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pm_name" render={({ field }) => (
                  <FormItem><FormLabel>Delivered By *</FormLabel><FormControl><Input placeholder="Project Manager Name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">System Description</div>
              <FormField control={form.control} name="what_it_does" render={({ field }) => (
                <FormItem>
                  <FormLabel>What This Pipeline Does *</FormLabel>
                  <FormControl><Textarea rows={4} placeholder="Plain-language description..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="business_impact" render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Impact</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Saves 12 hours/week, eliminates manual entry..." {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="trigger_description" render={({ field }) => (
                <FormItem>
                  <FormLabel>What Triggers the Pipeline *</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="e.g. A new row in Google Sheet..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2 flex justify-between items-center">
                <span>Pipeline Steps</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ step_label: `Step ${fields.length + 1}`, step_description: "" })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Step
                </Button>
              </div>
              <div className="space-y-4">
                {fields.map((item, index) => (
                  <div key={item.id} className="flex gap-3 items-start border-l-2 border-zinc-200 pl-4 py-2">
                    <div className="flex-1 space-y-2">
                      <FormField
                        control={form.control}
                        name={`pipeline_steps.${index}.step_label` as const}
                        render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="Step Label (e.g. Step 1: Read Sheet)" {...field} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`pipeline_steps.${index}.step_description` as const}
                        render={({ field }) => (
                          <FormItem><FormControl><Textarea rows={2} placeholder="Step description..." {...field} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 mt-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Infrastructure & Operations</div>
              <FormField control={form.control} name="tools_used" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tools & Integrations</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="List each tool, its role, and who owns the account..." {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="monitoring_location" render={({ field }) => (
                  <FormItem><FormLabel>Where to Monitor</FormLabel><FormControl><Input placeholder="e.g. n8n at ops.hisako.eu" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="error_alert_method" render={({ field }) => (
                  <FormItem><FormLabel>How Errors Are Alerted</FormLabel><FormControl><Input placeholder="e.g. Slack alert" {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="common_issues" render={({ field }) => (
                <FormItem>
                  <FormLabel>Common Issues & Fixes</FormLabel>
                  <FormControl><Textarea rows={4} placeholder="Symptom &rarr; Likely cause &rarr; Fix (one per line)..." {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="do_not_change" render={({ field }) => (
                <FormItem>
                  <FormLabel>Do Not Change Without Consulting Hisako</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="Specific variables or configurations that are brittle..." {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Escalation & SLA</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="escalation_email" render={({ field }) => (
                  <FormItem><FormLabel>Escalation Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="escalation_response_time" render={({ field }) => (
                  <FormItem><FormLabel>Response Time SLA</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="escalation_emergency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact (Failures Only)</FormLabel>
                  <FormControl><Input placeholder="Phone or messaging link" {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Lifecycle & Billing</div>
              <FormField control={form.control} name="monthly_review_date" render={({ field }) => (
                <FormItem><FormLabel>Monthly Review Date</FormLabel><FormControl><Input placeholder="e.g. First Monday of each month" {...field} /></FormControl></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="bug_fix_end_date" render={({ field }) => (
                  <FormItem><FormLabel>30-Day Bug Fix Period Ends</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="run_start_date" render={({ field }) => (
                  <FormItem><FormLabel>Run Phase Retainer Starts</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </FormWrapper>
);
}
