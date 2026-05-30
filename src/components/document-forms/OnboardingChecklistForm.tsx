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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  project_name: z.string().optional(),
  kickoff_date: z.string().optional(),
  pm_name: z.string().optional(),
  communication_channel: z.string().optional(),
  tool_access_list: z.string().optional(),
  checklist_state: z.record(z.string(), z.boolean()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CHECKLIST_ITEMS = [
  "Contract Signed",
  "First Invoice Paid",
  "Kickoff Meeting Scheduled",
  "Slack Connect Sent",
  "System Access Granted",
  "API Keys Provided"
];

export function OnboardingChecklistForm({ client, existingData, documentId, docLabel }: any) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const defaultChecklist: Record<string, boolean> = {};
  CHECKLIST_ITEMS.forEach(item => defaultChecklist[item] = false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      project_name: existingData?.project_name || "",
      kickoff_date: existingData?.kickoff_date || "",
      pm_name: existingData?.pm_name || "Hisako Team",
      communication_channel: existingData?.communication_channel || "Slack",
      tool_access_list: existingData?.tool_access_list || "",
      checklist_state: existingData?.checklist_state || defaultChecklist,
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
          docType: "onboarding-checklist",
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle>Project Details</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="project_name" render={({ field }) => (
            <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="kickoff_date" render={({ field }) => (
            <FormItem><FormLabel>Kickoff Date</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="pm_name" render={({ field }) => (
            <FormItem><FormLabel>Project Manager</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="communication_channel" render={({ field }) => (
            <FormItem><FormLabel>Comms Channel</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Access & Tools</CardTitle></CardHeader><CardContent>
          <FormField control={form.control} name="tool_access_list" render={({ field }) => (
            <FormItem><FormLabel>Required Access</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl></FormItem>
          )} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Checklist</CardTitle></CardHeader><CardContent className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <FormField key={item} control={form.control} name={`checklist_state.${item}`} render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer w-full">{item}</FormLabel>
              </FormItem>
            )} />
          ))}
        </CardContent></Card>

        <div className="flex justify-end"><Button type="submit" disabled={isGenerating} className="bg-[#E8400C] text-white"><FileText className="mr-2 h-4 w-4" />{isGenerating ? "Generating..." : "Generate & Save"}</Button></div>
      </form>
    </Form>
  );
}
