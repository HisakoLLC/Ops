"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { 
  Globe, Edit, Plus, FileText, StickyNote, Phone, Mail, 
  Calendar, ArrowRight, DollarSign, Download, RefreshCw, CheckCircle2 
} from "lucide-react";

import { Client, Activity, Document as DocType } from "@/types";
import { PIPELINE_STAGES, DOC_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import SendDocumentButton from "@/components/SendDocumentButton";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ExtendedActivity = Activity & { profiles?: { full_name: string | null; avatar_url: string | null } | null };
type ExtendedDoc = DocType & { profiles?: { full_name: string | null } | null };

export function ClientProfileClient({
  initialClient,
  initialActivities,
  initialDocuments,
}: {
  initialClient: Client;
  initialActivities: ExtendedActivity[];
  initialDocuments: ExtendedDoc[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  
  const [client, setClient] = useState<Client>(initialClient);
  const [activities, setActivities] = useState<ExtendedActivity[]>(initialActivities);
  const [notes, setNotes] = useState(client.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  // Add Activity Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<string>("note");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityBody, setActivityBody] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  const supabase = createClient();

  const handleStageChange = async (newStage: string) => {
    if (newStage === client.pipeline_stage) return;

    const oldStage = client.pipeline_stage;
    
    // Update client optimistically
    setClient({ ...client, pipeline_stage: newStage as any });
    
    const { data: userData } = await supabase.auth.getUser();

    // 1. Update client in DB
    const { error: updateError } = await supabase
      .from("clients")
      .update({ pipeline_stage: newStage })
      .eq("id", client.id);

    if (updateError) {
      toast.error("Failed to update stage");
      setClient({ ...client, pipeline_stage: oldStage }); // Revert
      return;
    }

    // 2. Insert activity
    const newActivity = {
      client_id: client.id,
      created_by: userData.user?.id,
      type: "stage_change",
      title: "Stage changed",
      metadata: { from_stage: oldStage, to_stage: newStage },
    };

    const { data: insertedActivity } = await supabase
      .from("activities")
      .insert([newActivity])
      .select(`*, profiles:created_by (full_name, avatar_url)`)
      .single();

    if (insertedActivity) {
      setActivities([insertedActivity as ExtendedActivity, ...activities]);
    }

    toast.success("Pipeline stage updated");
    router.refresh();
  };

  const handleSaveNotes = async () => {
    if (notes === client.notes) return;
    setIsSavingNotes(true);
    
    const { error } = await supabase
      .from("clients")
      .update({ notes })
      .eq("id", client.id);
      
    setIsSavingNotes(false);
    
    if (error) {
      toast.error("Failed to save notes");
    } else {
      toast.success("Notes saved");
      setClient({ ...client, notes });
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle) return;
    
    setIsSubmittingActivity(true);
    const { data: userData } = await supabase.auth.getUser();
    
    const newActivity = {
      client_id: client.id,
      created_by: userData.user?.id,
      type: activityType,
      title: activityTitle,
      body: activityBody || null,
    };

    const { data: insertedActivity, error } = await supabase
      .from("activities")
      .insert([newActivity])
      .select(`*, profiles:created_by (full_name, avatar_url)`)
      .single();
      
    setIsSubmittingActivity(false);
    
    if (error) {
      toast.error("Failed to add activity");
      return;
    }
    
    setActivities([insertedActivity as ExtendedActivity, ...activities]);
    setIsActivityModalOpen(false);
    setActivityTitle("");
    setActivityBody("");
    setActivityType("note");
    toast.success("Activity logged");
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "note": return <StickyNote className="h-4 w-4" />;
      case "call": return <Phone className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "meeting": return <Calendar className="h-4 w-4" />;
      case "stage_change": return <ArrowRight className="h-4 w-4" />;
      case "document_generated": return <FileText className="h-4 w-4" />;
      case "payment_received": return <DollarSign className="h-4 w-4" />;
      default: return <StickyNote className="h-4 w-4" />;
    }
  };

  const currentStageObj = PIPELINE_STAGES.find((s) => s.value === client.pipeline_stage);

  const formatUSD = (val: number | null) => {
    if (!val) return "$0";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* TASK 1: Client Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{client.company_name}</h1>
            <Badge variant="secondary" className="font-mono text-xs text-zinc-500">{client.ref}</Badge>
            {client.website && (
              <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <Globe className="h-5 w-5" />
              </a>
            )}
          </div>
          <div className="text-sm text-zinc-500">
            {client.contact_name} {client.contact_email && `• ${client.contact_email}`}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Pipeline Stage</span>
            <Select value={client.pipeline_stage || ""} onValueChange={(val) => handleStageChange(val as string)}>
              <SelectTrigger className={`w-[180px] h-9 border-transparent text-white ${currentStageObj?.color || 'bg-zinc-500'}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                      {stage.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Pipeline Value</span>
              <span className="font-semibold">{formatUSD(client.pipeline_value)}</span>
            </div>
            {client.retainer_active && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Retainer</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-500">{formatUSD(client.retainer_amount)}/mo</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/clients/${client.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" className="bg-[#E8400C] hover:bg-[#E8400C]/90 text-white" />}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Document
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {DOC_TYPES.map((doc) => (
                  <DropdownMenuItem key={doc.key} render={<Link href={`/clients/${client.id}/docs/new/${doc.key}`} className="cursor-pointer" />}>
                    {doc.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* TASK 2: Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Contact Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Name</span>
                      <span className="font-medium">{client.contact_name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Email</span>
                      <span className="font-medium">{client.contact_email || "-"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Phone</span>
                      <span className="font-medium">{client.contact_phone || "-"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Company Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Industry</span>
                      <span className="font-medium">{client.industry || "-"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Size</span>
                      <span className="font-medium">{client.company_size || "-"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Country</span>
                      <span className="font-medium">{client.country || "-"}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Pipeline & Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Source</span>
                      <span className="font-medium">{client.source || "-"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Created On</span>
                      <span className="font-medium">{format(new Date(client.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {client.tags && client.tags.length > 0 ? (
                        client.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))
                      ) : (
                        <span className="text-zinc-400">No tags</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Internal Notes</CardTitle>
                  {isSavingNotes && <span className="text-xs text-zinc-400">Saving...</span>}
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleSaveNotes}
                    placeholder="Add internal notes here... (auto-saves on blur)"
                    className="min-h-[150px] border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Pipeline Stage Timeline */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Pipeline Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 pl-2">
                    {PIPELINE_STAGES.map((stage, index) => {
                      // Logic to determine if stage is completed/current based on activity log
                      // For a simple visual, we can just highlight current and assume previous are done
                      const currentIndex = PIPELINE_STAGES.findIndex(s => s.value === client.pipeline_stage);
                      const isCurrent = stage.value === client.pipeline_stage;
                      const isCompleted = index < currentIndex && stage.value !== 'churned' && stage.value !== 'inactive';
                      
                      // Find stage entry date
                      const stageActivity = activities.find(a => 
                        a.type === 'stage_change' && a.metadata?.to_stage === stage.value
                      );
                      const dateText = isCurrent || isCompleted 
                        ? (stageActivity ? format(new Date(stageActivity.created_at), "MMM d, yyyy") : "-")
                        : null;

                      return (
                        <div key={stage.value} className="relative flex items-start gap-4">
                          {/* Connecting line */}
                          {index < PIPELINE_STAGES.length - 1 && (
                            <div className="absolute left-2.5 top-6 bottom-[-24px] w-px bg-zinc-200 dark:bg-zinc-800" />
                          )}
                          
                          {/* Indicator node */}
                          <div className="relative z-10 flex h-5 w-5 mt-0.5 items-center justify-center">
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-zinc-400" />
                            ) : isCurrent ? (
                              <div className="h-3 w-3 rounded-full bg-[#E8400C] ring-4 ring-[#E8400C]/20" />
                            ) : (
                              <div className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                            )}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${isCurrent ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>
                              {stage.label}
                            </span>
                            {dateText && (
                              <span className="text-xs text-zinc-400">{dateText}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: DOCUMENTS */}
        <TabsContent value="documents" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Generated Documents</h2>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button className="bg-[#E8400C] hover:bg-[#E8400C]/90 text-white" />}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Document
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {DOC_TYPES.map((doc) => (
                  <DropdownMenuItem key={doc.key} render={<Link href={`/clients/${client.id}/docs/new/${doc.key}`} className="cursor-pointer" />}>
                    {doc.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {initialDocuments.length === 0 ? (
            <Card className="border-dashed bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex h-48 flex-col items-center justify-center text-center p-6">
                <FileText className="h-10 w-10 text-zinc-300 mb-4 dark:text-zinc-700" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No documents yet</h3>
                <p className="text-sm text-zinc-500 max-w-sm mt-1">
                  Generate proposals, agreements, and reports based on the templates in your document factory.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialDocuments.map((doc) => {
                const docTypeObj = DOC_TYPES.find(d => d.key === doc.doc_type);
                return (
                  <Card key={doc.id} className="overflow-hidden">
                    <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-4 dark:bg-zinc-900/50 dark:border-zinc-800">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-500 shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold">{doc.doc_label}</CardTitle>
                            <div className="text-xs text-zinc-500 mt-0.5">
                              {docTypeObj?.label || doc.doc_type} • v{doc.version}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-white dark:bg-zinc-950">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
                        <span>Created {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                        <span>by {doc.profiles?.full_name || "Unknown"}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {doc.storage_path ? (
                          <>
                            {["proposal", "nda", "services_agreement", "monthly_report"].includes(doc.doc_type) ? (
                              <>
                                <Button variant="default" size="sm" className="flex-1" render={<a href={`/api/documents/download?id=${doc.id}&format=pdf`} target="_blank" rel="noreferrer" />}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                </Button>
                                {["nda", "services_agreement"].includes(doc.doc_type) && (
                                  <Button variant="outline" size="sm" render={<a href={`/api/documents/download?id=${doc.id}&format=docx`} target="_blank" rel="noreferrer" />}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Editable (.docx)
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button variant="default" size="sm" className="flex-1" render={<a href={`/api/documents/download?id=${doc.id}&format=docx`} target="_blank" rel="noreferrer" />}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download (.docx)
                              </Button>
                            )}
                            {!["discovery_script", "intake_questionnaire", "onboarding_checklist"].includes(doc.doc_type) && (
                              <SendDocumentButton
                                documentId={doc.id}
                                clientEmail={client.contact_email || ""}
                                clientName={client.contact_name || client.company_name}
                                docLabel={doc.doc_label}
                                docType={doc.doc_type}
                              />
                            )}
                          </>
                        ) : (
                          <Button variant="secondary" size="sm" className="flex-1" disabled>
                            Draft
                          </Button>
                        )}
                        <Button variant="outline" size="sm" render={<Link href={`/clients/${client.id}/docs/new/${doc.doc_type}?docId=${doc.id}`} />}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: ACTIVITY */}
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <CardTitle>Activity Feed</CardTitle>
              <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
                <DialogTrigger render={<Button size="sm" variant="outline" />}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Activity
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Activity</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddActivity} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Activity Type</Label>
                      <Select value={activityType} onValueChange={(val) => setActivityType(val || "note")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="payment_received">Payment Received</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input 
                        placeholder="e.g. Discovery call completed" 
                        value={activityTitle}
                        onChange={(e) => setActivityTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Details (optional)</Label>
                      <Textarea 
                        placeholder="Add notes or outcomes..." 
                        value={activityBody}
                        onChange={(e) => setActivityBody(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsActivityModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmittingActivity || !activityTitle}>
                        {isSubmittingActivity ? "Saving..." : "Log Activity"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {activities.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
                  No activity yet — log your first interaction.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {activities.map((activity) => (
                    <div key={activity.id} className="p-4 sm:px-6 hover:bg-zinc-50/50 transition-colors dark:hover:bg-zinc-900/50">
                      <div className="flex gap-4">
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex flex-1 flex-col space-y-1.5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                              {activity.title}
                            </div>
                            <div className="text-xs text-zinc-500 whitespace-nowrap">
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </div>
                          </div>
                          
                          {activity.type === 'stage_change' && activity.metadata && (
                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 w-fit px-2 py-1 rounded">
                              <span>{PIPELINE_STAGES.find(s => s.value === activity.metadata?.from_stage)?.label || activity.metadata?.from_stage}</span>
                              <ArrowRight className="h-3 w-3 text-zinc-400" />
                              <span className="text-[#E8400C]">{PIPELINE_STAGES.find(s => s.value === activity.metadata?.to_stage)?.label || activity.metadata?.to_stage}</span>
                            </div>
                          )}

                          {activity.body && (
                            <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap mt-1">
                              {activity.body}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1.5 pt-2">
                            <Avatar className="h-5 w-5 border border-zinc-200 dark:border-zinc-800">
                              <AvatarImage src={activity.profiles?.avatar_url || ""} />
                              <AvatarFallback className="text-[10px] bg-zinc-200 dark:bg-zinc-800">
                                {activity.profiles?.full_name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-zinc-500 font-medium">
                              {activity.profiles?.full_name || "Unknown User"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
