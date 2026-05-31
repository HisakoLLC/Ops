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
  agreement_date: z.string().min(1, "Agreement date is required"),
  client_country: z.string().min(1, "Client country of registration is required"),
  custom_clauses: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ServicesAgreementForm({ client, existingData, documentId, docLabel }: any) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      agreement_date: existingData?.agreement_date || format(new Date(), "yyyy-MM-dd"),
      client_country: existingData?.client_country || client.country || "",
      custom_clauses: existingData?.custom_clauses || "",
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
      docType="services_agreement"
      docLabel={docLabel || "Services Agreement"}
      documentId={documentId}
      onSubmit={onSubmitHandler}
    >
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="agreement_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agreement Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="client_country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client&apos;s Country of Registration *</FormLabel>
                    <FormControl><Input placeholder="e.g. Kenya, United Kingdom" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="custom_clauses" render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Clauses (optional)</FormLabel>
                  <FormControl><Textarea rows={4} placeholder="Add custom clauses to Section 8..." {...field} /></FormControl>
                  <p className="text-xs text-zinc-500 mt-1">
                    Any custom terms to add to Section 8. Leave blank for standard terms.
                  </p>
                </FormItem>
              )} />
              
              <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
                This document uses Hisako&apos;s standard terms. Only the fields above require your input. Review the generated document before sending.
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </FormWrapper>
);
}
