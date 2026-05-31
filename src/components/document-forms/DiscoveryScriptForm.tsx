"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormWrapper } from "./FormWrapper";

const formSchema = z.object({
  call_date: z.string().min(1, "Date is required"),
  pain_point_notes: z.string().optional(),
  tool_stack_notes: z.string().optional(),
  hours_per_week: z.string().optional(),
  people_count: z.string().optional(),
  budget_signal: z.string().optional(),
  timeline: z.string().optional(),
  previous_attempts: z.string().optional(),
  success_definition: z.string().optional(),
  scoring_pain: z.string().optional(),
  scoring_repeatability: z.string().optional(),
  scoring_budget: z.string().optional(),
  scoring_authority: z.string().optional(),
  scoring_timeline: z.string().optional(),
  scoring_stack: z.string().optional(),
  overall_assessment: z.string().optional(),
  proceed: z.string().optional(),
  next_steps: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function DiscoveryScriptForm({ client, existingData, documentId, docLabel }: any) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      call_date: existingData?.call_date || format(new Date(), "yyyy-MM-dd"),
      pain_point_notes: existingData?.pain_point_notes || "",
      tool_stack_notes: existingData?.tool_stack_notes || "",
      hours_per_week: existingData?.hours_per_week || "",
      people_count: existingData?.people_count || "",
      budget_signal: existingData?.budget_signal || "",
      timeline: existingData?.timeline || "",
      previous_attempts: existingData?.previous_attempts || "",
      success_definition: existingData?.success_definition || "",
      scoring_pain: existingData?.scoring_pain || "3",
      scoring_repeatability: existingData?.scoring_repeatability || "3",
      scoring_budget: existingData?.scoring_budget || "3",
      scoring_authority: existingData?.scoring_authority || "3",
      scoring_timeline: existingData?.scoring_timeline || "3",
      scoring_stack: existingData?.scoring_stack || "3",
      overall_assessment: existingData?.overall_assessment || "",
      proceed: existingData?.proceed || "yes",
      next_steps: existingData?.next_steps || "",
    },
  });

  const onSubmitHandler = async () => {
    const isValid = await form.trigger();
    if (!isValid) return null;
    return form.getValues();
  };

  const scores = ["1", "2", "3", "4", "5"];

  return (
    <FormWrapper
      clientId={client.id}
      docType="discovery_script"
      docLabel={docLabel || "Discovery Script"}
      documentId={documentId}
      onSubmit={onSubmitHandler}
    >
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Call Details</div>
              <FormField control={form.control} name="call_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Operations Mapping</div>
              <FormField control={form.control} name="pain_point_notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pain Point / Opening Answer</FormLabel>
                  <FormControl><Textarea rows={4} {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="tool_stack_notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tools & Stack They Use</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="hours_per_week" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours/Week Affected</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="people_count" render={({ field }) => (
                  <FormItem>
                    <FormLabel>People Doing This Work</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="previous_attempts" render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Attempts to Solve</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="success_definition" render={({ field }) => (
                <FormItem>
                  <FormLabel>Definition of Success</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Qualification</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="budget_signal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Signal</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="timeline" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Their Timeline</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Scoring</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {["pain", "repeatability", "budget", "authority", "timeline", "stack"].map((metric) => (
                  <FormField key={metric} control={form.control} name={`scoring_${metric}` as keyof FormValues} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">{metric.replace("_", " ")} Score</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {scores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                ))}
              </div>

              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-2">Next Steps</div>
              <FormField control={form.control} name="overall_assessment" render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Assessment</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="proceed" render={({ field }) => (
                <FormItem>
                  <FormLabel>Proceed</FormLabel>
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
              <FormField control={form.control} name="next_steps" render={({ field }) => (
                <FormItem>
                  <FormLabel>Agreed Next Steps</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </form>
      </Form>
    </FormWrapper>
);
}
