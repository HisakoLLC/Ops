"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  agreement_date: z.string().min(1, "Date is required"),
  client_country: z.string().optional(),
  custom_clauses: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ServicesAgreementForm({ client, existingData, documentId, docLabel }: any) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agreement_date: existingData?.agreement_date || format(new Date(), "MMMM d, yyyy"),
      client_country: existingData?.client_country || client.country || "",
      custom_clauses: existingData?.custom_clauses || "",
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
          docType: "services-agreement",
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
        <Card><CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="agreement_date" render={({ field }) => (
              <FormItem><FormLabel>Agreement Date</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="client_country" render={({ field }) => (
              <FormItem><FormLabel>Client Country</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="custom_clauses" render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Clauses (Optional)</FormLabel>
              <FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl>
            </FormItem>
          )} />
        </CardContent></Card>

        <div className="flex justify-end"><Button type="submit" disabled={isGenerating} className="bg-[#E8400C] text-white"><FileText className="mr-2 h-4 w-4" />{isGenerating ? "Generating..." : "Generate & Save"}</Button></div>
      </form>
    </Form>
  );
}
