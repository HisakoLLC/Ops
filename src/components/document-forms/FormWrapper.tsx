"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";

interface FormWrapperProps {
  clientId: string;
  docType: string;
  docLabel: string;
  documentId?: string;
  children: React.ReactNode;
  onSubmit: () => Promise<Record<string, any> | null> | Record<string, any> | null;
}

export function FormWrapper({
  clientId,
  docType,
  docLabel,
  documentId,
  children,
  onSubmit,
}: FormWrapperProps) {
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    const formData = await onSubmit();
    if (!formData) {
      toast.error("Form validation failed. Please check required fields.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, docType, formData, docLabel, documentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate");

      toast.success(`${docLabel} generated successfully!`);
      router.push(`/clients/${clientId}?tab=documents`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    const formData = await onSubmit();
    if (!formData) {
      toast.error("Form validation failed. Cannot save draft.");
      return;
    }
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      let error;
      if (documentId) {
        const { error: updateError } = await supabase
          .from("documents")
          .update({
            doc_label: docLabel.endsWith("(Draft)") ? docLabel : `${docLabel} (Draft)`,
            form_data: formData,
            storage_path: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", documentId);
        error = updateError;
      } else {
        const draftRecord = {
          client_id: clientId,
          created_by: user?.id,
          doc_type: docType,
          doc_label: `${docLabel} (Draft)`,
          form_data: formData,
          storage_path: null,
        };
        const { error: insertError } = await supabase.from("documents").insert(draftRecord);
        error = insertError;
      }
      if (error) throw error;
      
      toast.success("Draft saved successfully!");
      router.push(`/clients/${clientId}?tab=documents`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {children}
      <div className="flex items-center gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <Button
          onClick={handleGenerate}
          disabled={generating || saving}
          className="bg-[#E8400C] hover:bg-[#C73509] text-white"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> Generate & Save
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleSaveDraft} disabled={generating || saving}>
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
