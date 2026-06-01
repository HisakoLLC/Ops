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
  company_legal_name: z.string().min(1, "Required"),
  trading_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  registered_country: z.string().optional(),
  currency: z.string().optional(),
  whatsapp_number: z.string().optional(),
  calendly_url: z.string().url().optional().or(z.literal("")),
  deposit_percentage: z.coerce.number().optional(),
  payment_terms_days: z.coerce.number().optional(),
  late_payment_interest: z.coerce.number().optional(),
  retainer_notice_days: z.coerce.number().optional(),
  payment_link: z.string().optional().or(z.literal("")),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export function SettingsClient({ initialSettings }: any) {
  const router = useRouter();
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      company_legal_name: initialSettings?.company_legal_name || "Hisako Technologies Limited",
      trading_name: initialSettings?.trading_name || "Hisako",
      email: initialSettings?.email || "hello@hisako.eu",
      website: initialSettings?.website || "hisako.eu",
      registered_country: initialSettings?.registered_country || "Kenya",
      currency: initialSettings?.currency || "USD",
      whatsapp_number: initialSettings?.whatsapp_number || "",
      calendly_url: initialSettings?.calendly_url || "",
      deposit_percentage: initialSettings?.deposit_percentage || 50,
      payment_terms_days: initialSettings?.payment_terms_days || 7,
      late_payment_interest: initialSettings?.late_payment_interest || 2.0,
      retainer_notice_days: initialSettings?.retainer_notice_days || 30,
      payment_link: initialSettings?.payment_link || "",
    },
  });

  const watchCompanyName = form.watch("company_legal_name");

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
      company_legal_name: "Hisako Technologies Limited",
      trading_name: "Hisako",
      email: "hello@hisako.eu",
      website: "hisako.eu",
      registered_country: "Kenya",
      currency: "USD",
      whatsapp_number: "",
      calendly_url: "",
      deposit_percentage: 50,
      payment_terms_days: 7,
      late_payment_interest: 2.0,
      retainer_notice_days: 30,
      payment_link: "",
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
                <FormField control={form.control} name="company_legal_name" render={({ field }) => (
                  <FormItem><FormLabel>Legal Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="trading_name" render={({ field }) => (
                  <FormItem><FormLabel>Trading Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="hisako.eu" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Support Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="whatsapp_number" render={({ field }) => (
                  <FormItem><FormLabel>WhatsApp Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="calendly_url" render={({ field }) => (
                  <FormItem><FormLabel>Calendly URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="registered_country" render={({ field }) => (
                <FormItem><FormLabel>Registered Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
                <FormField control={form.control} name="payment_link" render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Payment Link / Bank Details</FormLabel>
                    <FormControl><Textarea {...field} placeholder="E.g. Stripe link or bank wire details..." className="bg-white/5" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document & Billing Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem><FormLabel>Currency</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="deposit_percentage" render={({ field }) => (
                  <FormItem><FormLabel>Deposit (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="payment_terms_days" render={({ field }) => (
                  <FormItem><FormLabel>Payment Terms (Days)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="late_payment_interest" render={({ field }) => (
                  <FormItem><FormLabel>Late Interest (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="retainer_notice_days" render={({ field }) => (
                  <FormItem><FormLabel>Retainer Notice (Days)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
