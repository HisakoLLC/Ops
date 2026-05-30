"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Save, RefreshCw } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const settingsSchema = z.object({
  company_name: z.string().min(1, "Required"),
  company_email: z.string().email().optional().or(z.literal("")),
  company_phone: z.string().optional(),
  company_website: z.string().url().optional().or(z.literal("")),
  company_address: z.string().optional(),
  default_currency: z.string().optional(),
  default_tax_rate: z.coerce.number().optional(),
  invoice_prefix: z.string().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export function SettingsClient({ initialSettings }: any) {
  const router = useRouter();
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: initialSettings?.company_name || "Hisako Technologies",
      company_email: initialSettings?.company_email || "",
      company_phone: initialSettings?.company_phone || "",
      company_website: initialSettings?.company_website || "https://hisako.com",
      company_address: initialSettings?.company_address || "",
      default_currency: initialSettings?.default_currency || "USD",
      default_tax_rate: initialSettings?.default_tax_rate || 0,
      invoice_prefix: initialSettings?.invoice_prefix || "INV-",
    },
  });

  const watchCompanyName = form.watch("company_name");

  async function onSubmit(data: SettingsValues) {
    setIsSaving(true);
    
    // Update or insert
    const payload = {
      ...data,
      id: initialSettings?.id || 1, // Assume single row settings table
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("settings")
      .upsert([payload]);

    setIsSaving(false);

    if (error) {
      toast.error("Failed to save settings");
      return;
    }

    toast.success("Settings saved");
    router.refresh();
  }

  const handleResetDefaults = () => {
    form.reset({
      company_name: "Hisako Technologies",
      company_email: "",
      company_phone: "",
      company_website: "https://hisako.com",
      company_address: "",
      default_currency: "USD",
      default_tax_rate: 0,
      invoice_prefix: "INV-",
    });
    toast.info("Reset to default values. Don't forget to save.");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your company information and default document configurations.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>This information is used across all generated documents and proposals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="company_name" render={({ field }) => (
                  <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="company_website" render={({ field }) => (
                  <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="company_email" render={({ field }) => (
                  <FormItem><FormLabel>Support Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="company_phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="company_address" render={({ field }) => (
                <FormItem><FormLabel>Business Address</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document & Billing Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="default_currency" render={({ field }) => (
                  <FormItem><FormLabel>Default Currency</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="default_tax_rate" render={({ field }) => (
                  <FormItem><FormLabel>Tax Rate (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="invoice_prefix" render={({ field }) => (
                  <FormItem><FormLabel>Invoice Prefix</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h4 className="text-sm font-semibold mb-2">Document Preview</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  &quot;This agreement is made between <strong>{watchCompanyName || "[Company Name]"}</strong> and the Client...&quot;
                </p>
              </div>
              
              <Button type="button" variant="outline" size="sm" onClick={handleResetDefaults}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Defaults
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="bg-[#E8400C] hover:bg-[#E8400C]/90 text-white">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
