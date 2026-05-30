"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.record(z.string().optional());

export function IntakeQuestionnaireForm({ client, existingData, documentId, docLabel }: any) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: existingData || {},
  });

  async function onSubmit(data: any) {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          docType: "intake-questionnaire",
          docLabel: docLabel,
          formData: data,
          documentId,
        }),
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

  const renderInput = (name: string, label: string, isTextarea = false) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>{isTextarea ? <Textarea {...field} /> : <Input {...field} />}</FormControl>
      </FormItem>
    )} />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle>1. Process Description</CardTitle></CardHeader><CardContent className="space-y-4">
          {renderInput("manual_process_description", "Manual Process Description", true)}
          <div className="grid grid-cols-2 gap-4">
            {renderInput("people_count", "People Count")}
            {renderInput("hours_per_week", "Hours Per Week")}
          </div>
        </CardContent></Card>
        
        <Card><CardHeader><CardTitle>2. Impact</CardTitle></CardHeader><CardContent className="space-y-4">
          {renderInput("consequence_of_failure", "Consequence of Failure", true)}
          {renderInput("previous_attempts", "Previous Attempts", true)}
        </CardContent></Card>

        <Card><CardHeader><CardTitle>3. Systems</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4">
          {renderInput("tools_crm", "CRM")}
          {renderInput("tools_email", "Email")}
          {renderInput("tools_calendar", "Calendar")}
          {renderInput("tools_pm", "Project Management")}
          {renderInput("tools_spreadsheets", "Spreadsheets")}
          {renderInput("tools_database", "Database")}
          {renderInput("tools_comms", "Comms")}
          {renderInput("tools_custom", "Custom/Other")}
        </CardContent></Card>

        <Card><CardHeader><CardTitle>4. Success & Logistics</CardTitle></CardHeader><CardContent className="space-y-4">
          {renderInput("success_definition", "Success Definition", true)}
          {renderInput("success_metrics", "Metrics")}
          <div className="grid grid-cols-2 gap-4">
            {renderInput("must_stay_manual", "Must Stay Manual?")}
            {renderInput("compliance_requirements", "Compliance Requirements")}
            {renderInput("desired_live_date", "Desired Live Date")}
            {renderInput("timeline_flexible", "Timeline Flexible?")}
            {renderInput("budget_range", "Budget Range")}
            {renderInput("open_to_retainer", "Open to Retainer?")}
          </div>
          {renderInput("budget_approver", "Budget Approver")}
          {renderInput("additional_notes", "Additional Notes", true)}
        </CardContent></Card>

        <div className="flex justify-end"><Button type="submit" disabled={isGenerating} className="bg-[#E8400C] text-white"><FileText className="mr-2 h-4 w-4" />{isGenerating ? "Generating..." : "Generate & Save"}</Button></div>
      </form>
    </Form>
  );
}
