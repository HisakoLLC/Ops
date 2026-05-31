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
  project_name: z.string().min(1, "Project/Pipeline name is required"),
  kickoff_date: z.string().min(1, "Kickoff date is required"),
  pm_name: z.string().min(1, "Project Manager is required"),
  communication_channel: z.string().min(1, "Communication channel is required"),
  tool_access_list: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function OnboardingChecklistForm({ client, existingData, documentId, docLabel }: any) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      project_name: existingData?.project_name || "",
      kickoff_date: existingData?.kickoff_date || format(new Date(), "yyyy-MM-dd"),
      pm_name: existingData?.pm_name || "",
      communication_channel: existingData?.communication_channel || "Slack",
      tool_access_list: existingData?.tool_access_list || "HubSpot CRM\nGoogle Workspace\nGithub",
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
      docType="onboarding_checklist"
      docLabel={docLabel || "Onboarding Checklist"}
      documentId={documentId}
      onSubmit={onSubmitHandler}
    >
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField control={form.control} name="project_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project / Pipeline Name *</FormLabel>
                  <FormControl><Input placeholder="e.g. Lead Qualification Pipeline" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="kickoff_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kickoff Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pm_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Manager (Hisako) *</FormLabel>
                    <FormControl><Input placeholder="e.g. Mohamed Ismail" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="communication_channel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Channel *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Slack">Slack</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="tool_access_list" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tools to Request Access To</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="List each tool on a new line, e.g.:&#10;HubSpot CRM&#10;Gmail API&#10;Google Sheets"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )} />
              
              <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
                The checklist in the generated document tracks progress through onboarding. Update the document as items are completed.
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </FormWrapper>
);
}
