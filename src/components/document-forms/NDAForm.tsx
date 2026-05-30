"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileText, Save } from "lucide-react";

import { Client } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  nda_date: z.string().min(1, "Date is required"),
  recipient_name: z.string().min(1, "Recipient name is required"),
  recipient_company: z.string().min(1, "Company is required"),
  purpose_override: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NDAFormProps {
  client: Client;
  settings: any;
  existingData?: Record<string, any>;
  documentId?: string;
  docLabel: string;
}

export function NDAForm({ client, existingData, documentId, docLabel }: NDAFormProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nda_date: existingData?.nda_date || format(new Date(), "MMMM d, yyyy"),
      recipient_name: existingData?.recipient_name || client.contact_name || "",
      recipient_company: existingData?.recipient_company || client.company_name || "",
      purpose_override: existingData?.purpose_override || "",
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
          docType: "nda",
          docLabel: docLabel,
          formData: data,
          documentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Generation failed");

      toast.success("Document generated successfully!");
      router.push(`/clients/${client.id}?tab=documents`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nda_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipient_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Company</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipient_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Representative Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="purpose_override"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Purpose (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Leave blank to use standard purpose clause..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isGenerating} className="bg-[#E8400C] hover:bg-[#E8400C]/90 text-white">
            <FileText className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate & Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
