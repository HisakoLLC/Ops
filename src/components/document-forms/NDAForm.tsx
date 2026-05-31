"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormWrapper } from "./FormWrapper";

const formSchema = z.object({
  nda_date: z.string().min(1, "NDA date is required"),
  recipient_name: z.string().min(1, "Recipient name is required"),
  recipient_company: z.string().min(1, "Recipient company is required"),
  purpose_override: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function NDAForm({ client, existingData, documentId, docLabel }: any) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      nda_date: existingData?.nda_date || format(new Date(), "yyyy-MM-dd"),
      recipient_name: existingData?.recipient_name || client.contact_name || "",
      recipient_company: existingData?.recipient_company || client.company_name || "",
      purpose_override: existingData?.purpose_override || "",
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
      docType="nda"
      docLabel={docLabel || "Non-Disclosure Agreement"}
      documentId={documentId}
      onSubmit={onSubmitHandler}
    >
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField control={form.control} name="nda_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>NDA Date *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="recipient_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name *</FormLabel>
                    <FormControl><Input placeholder="Who is signing?" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="recipient_company" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Company *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="purpose_override" render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose (optional override)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Evaluating a potential engagement for AI automation services"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-zinc-500 mt-1">
                    Leave blank to use the standard purpose statement.
                  </p>
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </form>
      </Form>
    </FormWrapper>
);
}
