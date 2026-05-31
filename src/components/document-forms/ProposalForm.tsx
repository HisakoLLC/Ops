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
import { Checkbox } from "@/components/ui/checkbox";
import { FormWrapper } from "./FormWrapper";

const formSchema = z.object({
  proposal_date: z.string().min(1, "Proposal date is required"),
  valid_days: z.coerce.number().min(1, "Must be at least 1 day"),
  pipeline_name: z.string().min(1, "Pipeline/Project name is required"),
  pipeline_description: z.string().min(1, "Description is required"),
  architecture_steps: z.array(z.object({
    step_number: z.coerce.number(),
    description: z.string().min(1, "Step description is required"),
  })),
  tools_used: z.array(z.string()).default([]),
  build_fee: z.coerce.number().min(0, "Must be a positive number"),
  retainer_fee: z.coerce.number().min(0, "Must be a positive number"),
  third_party_cost_estimate: z.string().optional(),
  kickoff_date: z.string().optional(),
  map_duration: z.string().optional(),
  design_duration: z.string().optional(),
  build_duration: z.string().optional(),
  go_live_date: z.string().optional(),
  total_timeline: z.string().optional(),
  custom_inclusions: z.string().optional(),
  custom_exclusions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AVAILABLE_TOOLS = [
  { id: "n8n", label: "n8n" },
  { id: "Make", label: "Make" },
  { id: "Python", label: "Python" },
  { id: "Claude (Anthropic)", label: "Claude (Anthropic)" },
  { id: "GPT-4o (OpenAI)", label: "GPT-4o (OpenAI)" },
  { id: "Gemini (Google)", label: "Gemini (Google)" },
  { id: "Custom API", label: "Custom API" },
  { id: "Other", label: "Other" },
];

export function ProposalForm({ client, existingData, documentId, docLabel }: any) {
  // Convert tools_used from comma-separated string back to array if needed
  let initialTools: string[] = [];
  if (existingData?.tools_used) {
    initialTools = typeof existingData.tools_used === "string" 
      ? existingData.tools_used.split(", ").filter(Boolean) 
      : existingData.tools_used;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      proposal_date: existingData?.proposal_date || format(new Date(), "yyyy-MM-dd"),
      valid_days: existingData?.valid_days || 30,
      pipeline_name: existingData?.pipeline_name || "",
      pipeline_description: existingData?.pipeline_description || "",
      architecture_steps: existingData?.architecture_steps || [
        { step_number: 1, description: "" },
        { step_number: 2, description: "" },
        { step_number: 3, description: "" },
        { step_number: 4, description: "" },
      ],
      tools_used: initialTools,
      build_fee: existingData?.build_fee || 5000,
      retainer_fee: existingData?.retainer_fee || client.retainer_amount || 0,
      third_party_cost_estimate: existingData?.third_party_cost_estimate || "",
      kickoff_date: existingData?.kickoff_date || "",
      map_duration: existingData?.map_duration || "2 days",
      design_duration: existingData?.design_duration || "3 days",
      build_duration: existingData?.build_duration || "2 weeks",
      go_live_date: existingData?.go_live_date || "",
      total_timeline: existingData?.total_timeline || "4 weeks",
      custom_inclusions: existingData?.custom_inclusions || "",
      custom_exclusions: existingData?.custom_exclusions || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "architecture_steps",
  });

  const buildFee = form.watch("build_fee") || 0;
  const deposit = buildFee / 2;

  const onSubmitHandler = async () => {
    const isValid = await form.trigger();
    if (!isValid) return null;
    
    const values = form.getValues();
    return {
      ...values,
      // Map back tools_used as a comma-separated string as required by doc builder
      tools_used: values.tools_used.join(", "),
      clientCompany: client.company_name,
      clientContact: client.contact_name,
    };
  };

  return (
    <FormWrapper
      clientId={client.id}
      docType="proposal"
      docLabel={docLabel || "Proposal"}
      documentId={documentId}
      onSubmit={onSubmitHandler}
    >
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Proposal Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="proposal_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposal Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="valid_days" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Days *</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="pipeline_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pipeline / Project Name *</FormLabel>
                  <FormControl><Input placeholder="e.g. Lead Qualification Automation" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="pipeline_description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pipeline Description *</FormLabel>
                  <FormControl><Textarea rows={4} placeholder="Describe what the pipeline accomplishes..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2 flex justify-between items-center">
                <span>Architecture Steps</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ step_number: fields.length + 1, description: "" })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Step
                </Button>
              </div>
              <div className="space-y-3">
                {fields.map((item, index) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="pt-2 text-sm font-semibold text-zinc-500 w-8">#{index + 1}</div>
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`architecture_steps.${index}.description` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input placeholder={`Description for Step ${index + 1}`} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Tools & Integrations</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AVAILABLE_TOOLS.map((tool) => (
                  <FormField
                    key={tool.id}
                    control={form.control}
                    name="tools_used"
                    render={({ field }) => {
                      return (
                        <FormItem key={tool.id} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(tool.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), tool.id])
                                  : field.onChange(field.value?.filter((value) => value !== tool.id));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer select-none">
                            {tool.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Financials</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="build_fee" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Build Fee (USD) *</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="retainer_fee" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Retainer (USD) *</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm">
                <div>
                  <span className="text-zinc-500">50% Deposit Invoice:</span>
                  <span className="font-semibold block text-base">${deposit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-500">50% Delivery Invoice:</span>
                  <span className="font-semibold block text-base">${deposit.toLocaleString()}</span>
                </div>
              </div>

              <FormField control={form.control} name="third_party_cost_estimate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Est. Third-Party Costs/mo</FormLabel>
                  <FormControl><Input placeholder="e.g. $45/mo for n8n + OpenAI" {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Timeline & Milestones</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="kickoff_date" render={({ field }) => (
                  <FormItem><FormLabel>Kickoff Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="map_duration" render={({ field }) => (
                  <FormItem><FormLabel>Map Phase Duration</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="design_duration" render={({ field }) => (
                  <FormItem><FormLabel>Design Phase Duration</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="build_duration" render={({ field }) => (
                  <FormItem><FormLabel>Build Phase Duration</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="go_live_date" render={({ field }) => (
                  <FormItem><FormLabel>Go-Live Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="total_timeline" render={({ field }) => (
                  <FormItem><FormLabel>Total Timeline</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Scope Details</div>
              <FormField control={form.control} name="custom_inclusions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Inclusions (optional)</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="List items included..." {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="custom_exclusions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Exclusions (optional)</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="List items excluded..." {...field} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </form>
      </Form>
    </FormWrapper>
);
}
