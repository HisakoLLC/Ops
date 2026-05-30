"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileText } from "lucide-react";

import { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  call_date: z.string().min(1, "Date is required"),
  pain_point_notes: z.string().optional(),
  tool_stack_notes: z.string().optional(),
  hours_affected: z.string().optional(),
  budget_signal: z.string().optional(),
  timeline: z.string().optional(),
  scoring_pain_clarity: z.string().optional(),
  scoring_repeatability: z.string().optional(),
  scoring_budget: z.string().optional(),
  scoring_authority: z.string().optional(),
  scoring_timeline: z.string().optional(),
  scoring_stack: z.string().optional(),
  overall_assessment: z.string().optional(),
  proceed: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function DiscoveryScriptForm({ client, existingData, documentId, docLabel }: any) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      call_date: existingData?.call_date || format(new Date(), "MMMM d, yyyy"),
      pain_point_notes: existingData?.pain_point_notes || "",
      tool_stack_notes: existingData?.tool_stack_notes || "",
      hours_affected: existingData?.hours_affected || "",
      budget_signal: existingData?.budget_signal || "",
      timeline: existingData?.timeline || "",
      scoring_pain_clarity: existingData?.scoring_pain_clarity || "3",
      scoring_repeatability: existingData?.scoring_repeatability || "3",
      scoring_budget: existingData?.scoring_budget || "3",
      scoring_authority: existingData?.scoring_authority || "3",
      scoring_timeline: existingData?.scoring_timeline || "3",
      scoring_stack: existingData?.scoring_stack || "3",
      overall_assessment: existingData?.overall_assessment || "",
      proceed: existingData?.proceed || "yes",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          docType: "discovery-script",
          docLabel: docLabel,
          formData: data,
          documentId,
        }),
      });
      if (!response.ok) throw new Error("Generation failed");
      toast.success("Document generated successfully!");
      router.push(`/clients/${client.id}?tab=documents`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
  }

  const scores = ["1", "2", "3", "4", "5"];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardContent className="pt-6 space-y-4">
          <FormField control={form.control} name="call_date" render={({ field }) => (
            <FormItem><FormLabel>Call Date</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="pain_point_notes" render={({ field }) => (
            <FormItem><FormLabel>Pain Point Notes</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="tool_stack_notes" render={({ field }) => (
            <FormItem><FormLabel>Tool Stack</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
          )} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="hours_affected" render={({ field }) => (
              <FormItem><FormLabel>Hours Affected</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="budget_signal" render={({ field }) => (
              <FormItem><FormLabel>Budget Signal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="timeline" render={({ field }) => (
              <FormItem><FormLabel>Timeline</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
          
          <h3 className="font-semibold text-sm mt-6">Qualification Scoring (1-5)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['pain_clarity', 'repeatability', 'budget', 'authority', 'timeline', 'stack'].map(metric => (
              <FormField key={metric} control={form.control} name={`scoring_${metric}` as keyof FormValues} render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">{metric.replace('_', ' ')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{scores.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
            ))}
          </div>

          <FormField control={form.control} name="overall_assessment" render={({ field }) => (
            <FormItem className="mt-4"><FormLabel>Overall Assessment</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="proceed" render={({ field }) => (
            <FormItem>
              <FormLabel>Proceed?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="maybe">Maybe</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </CardContent></Card>
        <div className="flex justify-end"><Button type="submit" disabled={isGenerating} className="bg-[#E8400C] text-white"><FileText className="mr-2 h-4 w-4" />{isGenerating ? "Generating..." : "Generate & Save"}</Button></div>
      </form>
    </Form>
  );
}
