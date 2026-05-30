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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  pipeline_name: z.string().optional(),
  pipeline_description: z.string().optional(),
  architecture_steps: z.array(z.object({ number: z.string(), description: z.string() })).optional(),
  tools_used: z.array(z.string()).optional(),
  build_fee: z.string().optional(),
  retainer_fee: z.string().optional(),
  third_party_cost_estimate: z.string().optional(),
  kickoff_date: z.string().optional(),
  map_duration: z.string().optional(),
  design_duration: z.string().optional(),
  build_duration: z.string().optional(),
  total_timeline: z.string().optional(),
  go_live_date: z.string().optional(),
  valid_days: z.string().optional(),
  custom_inclusions: z.string().optional(),
  custom_exclusions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const TOOLS = ["n8n", "Make", "Python", "Claude", "GPT-4o", "Gemini", "Other"];

export function ProposalForm({ client, existingData, documentId, docLabel }: any) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pipeline_name: existingData?.pipeline_name || "",
      pipeline_description: existingData?.pipeline_description || "",
      architecture_steps: existingData?.architecture_steps || [{ number: "1", description: "" }],
      tools_used: existingData?.tools_used || [],
      build_fee: existingData?.build_fee || client.pipeline_value?.toString() || "",
      retainer_fee: existingData?.retainer_fee || client.retainer_amount?.toString() || "",
      third_party_cost_estimate: existingData?.third_party_cost_estimate || "",
      kickoff_date: existingData?.kickoff_date || "",
      map_duration: existingData?.map_duration || "1 Week",
      design_duration: existingData?.design_duration || "1 Week",
      build_duration: existingData?.build_duration || "2 Weeks",
      total_timeline: existingData?.total_timeline || "4 Weeks",
      go_live_date: existingData?.go_live_date || "",
      valid_days: existingData?.valid_days || "30",
      custom_inclusions: existingData?.custom_inclusions || "",
      custom_exclusions: existingData?.custom_exclusions || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "architecture_steps",
  });

  async function onSubmit(data: FormValues) {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          docType: "proposal",
          docLabel: docLabel,
          formData: data,
          documentId,
        }),
      });
      if (!response.ok) throw new Error("Generation failed");
      toast.success("Proposal generated!");
      router.push(`/clients/${client.id}?tab=documents`);
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to generate proposal");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle>1. Executive Summary</CardTitle></CardHeader><CardContent className="space-y-4">
          <FormField control={form.control} name="pipeline_name" render={({ field }) => (
            <FormItem><FormLabel>Pipeline Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="pipeline_description" render={({ field }) => (
            <FormItem><FormLabel>Pipeline Description</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
          )} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>2. Architecture & Tools</CardTitle></CardHeader><CardContent className="space-y-6">
          <div className="space-y-4">
            <FormLabel>Architecture Steps</FormLabel>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center">
                <FormField control={form.control} name={`architecture_steps.${index}.number`} render={({ field }) => (
                  <FormControl><Input className="w-16" {...field} /></FormControl>
                )} />
                <FormField control={form.control} name={`architecture_steps.${index}.description`} render={({ field }) => (
                  <FormControl><Input className="flex-1" placeholder="Step description..." {...field} /></FormControl>
                )} />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ number: (fields.length + 1).toString(), description: "" })}>
              <Plus className="mr-2 h-4 w-4" /> Add Step
            </Button>
          </div>
          <FormField control={form.control} name="tools_used" render={() => (
            <FormItem>
              <FormLabel>Tools Used</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {TOOLS.map((tool) => (
                  <FormField key={tool} control={form.control} name="tools_used" render={({ field }) => {
                    return (
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value?.includes(tool)} onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), tool])
                              : field.onChange(field.value?.filter((value) => value !== tool));
                          }} />
                        </FormControl>
                        <FormLabel className="font-normal">{tool}</FormLabel>
                      </FormItem>
                    );
                  }} />
                ))}
              </div>
            </FormItem>
          )} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>3. Commercials</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="build_fee" render={({ field }) => (
            <FormItem><FormLabel>Build Fee ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="retainer_fee" render={({ field }) => (
            <FormItem><FormLabel>Monthly Retainer ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="third_party_cost_estimate" render={({ field }) => (
            <FormItem><FormLabel>Est. 3rd Party Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>4. Timeline</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['kickoff_date', 'map_duration', 'design_duration', 'build_duration', 'total_timeline', 'go_live_date'].map(item => (
            <FormField key={item} control={form.control} name={item as keyof FormValues} render={({ field }) => (
              <FormItem><FormLabel className="capitalize">{item.replace('_', ' ')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          ))}
        </CardContent></Card>

        <Card><CardHeader><CardTitle>5. Scope Details</CardTitle></CardHeader><CardContent className="space-y-4">
          <FormField control={form.control} name="custom_inclusions" render={({ field }) => (
            <FormItem><FormLabel>Inclusions</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="custom_exclusions" render={({ field }) => (
            <FormItem><FormLabel>Exclusions</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="valid_days" render={({ field }) => (
            <FormItem><FormLabel>Valid Days</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
        </CardContent></Card>

        <div className="flex justify-end"><Button type="submit" disabled={isGenerating} className="bg-[#E8400C] text-white"><FileText className="mr-2 h-4 w-4" />{isGenerating ? "Generating..." : "Generate Proposal"}</Button></div>
      </form>
    </Form>
  );
}
