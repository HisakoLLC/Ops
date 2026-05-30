"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  report_month: z.string().optional(),
  report_year: z.string().optional(),
  total_executions: z.string().optional(),
  successful_runs: z.string().optional(),
  failed_runs: z.string().optional(),
  success_rate: z.string().optional(),
  avg_execution_time: z.string().optional(),
  records_processed: z.string().optional(),
  hours_saved: z.string().optional(),
  tasks_eliminated: z.string().optional(),
  executive_summary: z.string().optional(),
  planned_next_month: z.string().optional(),
  retainer_amount: z.string().optional(),
  n8n_cost: z.string().optional(),
  api_cost: z.string().optional(),
  next_report_date: z.string().optional(),
  incidents: z.array(z.object({ date: z.string(), severity: z.string(), description: z.string(), resolution: z.string() })).optional(),
  optimisations: z.array(z.object({ change: z.string(), impact: z.string() })).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function MonthlyReportForm({ client, existingData, documentId, docLabel }: any) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      report_month: existingData?.report_month || new Date().toLocaleString('default', { month: 'long' }),
      report_year: existingData?.report_year || new Date().getFullYear().toString(),
      total_executions: existingData?.total_executions || "0",
      successful_runs: existingData?.successful_runs || "0",
      failed_runs: existingData?.failed_runs || "0",
      success_rate: existingData?.success_rate || "100",
      avg_execution_time: existingData?.avg_execution_time || "1s",
      records_processed: existingData?.records_processed || "0",
      hours_saved: existingData?.hours_saved || "0",
      tasks_eliminated: existingData?.tasks_eliminated || "0",
      executive_summary: existingData?.executive_summary || "",
      planned_next_month: existingData?.planned_next_month || "",
      retainer_amount: existingData?.retainer_amount || client.retainer_amount?.toString() || "0",
      n8n_cost: existingData?.n8n_cost || "0",
      api_cost: existingData?.api_cost || "0",
      next_report_date: existingData?.next_report_date || "",
      incidents: existingData?.incidents || [],
      optimisations: existingData?.optimisations || [],
    },
  });

  const { fields: incidentFields, append: appendIncident, remove: removeIncident } = useFieldArray({ control: form.control, name: "incidents" });
  const { fields: optFields, append: appendOpt, remove: removeOpt } = useFieldArray({ control: form.control, name: "optimisations" });

  async function onSubmit(data: FormValues) {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, docType: "monthly-report", docLabel, formData: data, documentId }),
      });
      if (!response.ok) throw new Error("Generation failed");
      toast.success("Document generated!");
      router.push(`/clients/${client.id}?tab=documents`);
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle>Overview</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="report_month" render={({ field }) => (
              <FormItem><FormLabel>Month</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="report_year" render={({ field }) => (
              <FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="executive_summary" render={({ field }) => (
            <FormItem><FormLabel>Executive Summary</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
          )} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Metrics</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['total_executions', 'successful_runs', 'failed_runs', 'success_rate', 'avg_execution_time', 'records_processed', 'hours_saved', 'tasks_eliminated'].map(item => (
            <FormField key={item} control={form.control} name={item as keyof FormValues} render={({ field }) => (
              <FormItem><FormLabel className="capitalize text-xs">{item.replace(/_/g, ' ')}</FormLabel><FormControl><Input {...field as any} /></FormControl></FormItem>
            )} />
          ))}
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Incidents & Optimisations</CardTitle></CardHeader><CardContent className="space-y-6">
          <div className="space-y-4">
            <FormLabel>Incidents</FormLabel>
            {incidentFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center">
                <FormField control={form.control} name={`incidents.${index}.description`} render={({ field }) => (
                  <FormControl><Input placeholder="Issue..." {...field} /></FormControl>
                )} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeIncident(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendIncident({ date: "", severity: "", description: "", resolution: "" })}>
              <Plus className="mr-2 h-4 w-4" /> Add Incident
            </Button>
          </div>
          
          <div className="space-y-4">
            <FormLabel>Optimisations</FormLabel>
            {optFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center">
                <FormField control={form.control} name={`optimisations.${index}.change`} render={({ field }) => (
                  <FormControl><Input placeholder="Change..." {...field} /></FormControl>
                )} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOpt(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendOpt({ change: "", impact: "" })}>
              <Plus className="mr-2 h-4 w-4" /> Add Optimisation
            </Button>
          </div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Commercials</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField control={form.control} name="retainer_amount" render={({ field }) => (
            <FormItem><FormLabel>Retainer</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="n8n_cost" render={({ field }) => (
            <FormItem><FormLabel>n8n Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="api_cost" render={({ field }) => (
            <FormItem><FormLabel>API Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="next_report_date" render={({ field }) => (
            <FormItem><FormLabel>Next Report</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
        </CardContent></Card>

        <div className="flex justify-end"><Button type="submit" disabled={isGenerating} className="bg-[#E8400C] text-white"><FileText className="mr-2 h-4 w-4" />{isGenerating ? "Generating..." : "Generate & Save"}</Button></div>
      </form>
    </Form>
  );
}
