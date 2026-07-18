"use client";

import { useState } from "react";
import { formatDistanceToNow, subDays } from "date-fns";
import Link from "next/link";
import {
  Zap,
  Search,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Mail,
  FileText,
  Loader2,
  AlertCircle,
  Settings,
  Save,
  Play,
  Pause
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { AOELead, AOELeadStatus, QualificationConfidence, IcpConfig } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AoeLeadsClientProps {
  initialLeads: AOELead[];
  initialIcpConfig: IcpConfig | null;
}

export function AoeLeadsClient({ initialLeads, initialIcpConfig }: AoeLeadsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [leads, setLeads] = useState<AOELead[]>(initialLeads);
  
  // Views Toggle Tab
  const [activeView, setActiveView] = useState<'prospects' | 'settings'>('prospects');

  // ICP Config states
  const [icpConfig, setIcpConfig] = useState<IcpConfig | null>(initialIcpConfig);
  const [isSavingIcp, setIsSavingIcp] = useState(false);

  // Form fields for ICP
  const [isActive, setIsActive] = useState<boolean>(initialIcpConfig?.is_active ?? true);
  const [targetIndustries, setTargetIndustries] = useState<string>(
    initialIcpConfig?.target_industries?.join(", ") ?? ""
  );
  const [excludedIndustries, setExcludedIndustries] = useState<string>(
    initialIcpConfig?.excluded_industries?.join(", ") ?? ""
  );
  const [targetGeographies, setTargetGeographies] = useState<string>(
    initialIcpConfig?.target_geographies?.join(", ") ?? ""
  );
  const [excludedKeywords, setExcludedKeywords] = useState<string>(
    initialIcpConfig?.excluded_keywords?.join(", ") ?? ""
  );
  const [icpDescription, setIcpDescription] = useState<string>(
    initialIcpConfig?.icp_description ?? ""
  );
  const [serviceFramework, setServiceFramework] = useState<string>(
    initialIcpConfig?.service_framework ?? ""
  );

  const handleSaveIcp = async () => {
    setIsSavingIcp(true);
    try {
      const payload = {
        ...(icpConfig?.id ? { id: icpConfig.id } : {}),
        is_active: isActive,
        target_industries: targetIndustries.split(",").map(s => s.trim()).filter(Boolean),
        excluded_industries: excludedIndustries.split(",").map(s => s.trim()).filter(Boolean),
        target_geographies: targetGeographies.split(",").map(s => s.trim()).filter(Boolean),
        excluded_keywords: excludedKeywords.split(",").map(s => s.trim()).filter(Boolean),
        icp_description: icpDescription.trim() || null,
        service_framework: serviceFramework.trim() || null,
      };

      const { data, error } = await supabase
        .from('icp_config')
        .upsert(payload)
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setIcpConfig(data);
      toast.success("ICP settings saved successfully!");
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSavingIcp(false);
    }
  };
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Selected lead for detail sheet panel
  const [selectedLead, setSelectedLead] = useState<AOELead | null>(null);
  
  // Button loading states
  const [isSendingEmail, setIsSendingEmail] = useState<Record<number, boolean>>({});
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [notesSaveStatus, setNotesSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Stats Row calculations
  const totalReceived = leads.length;
  const pendingCount = leads.filter((l) => l.status === "PENDING_REVIEW").length;

  const sevenDaysAgo = subDays(new Date(), 7);
  const emailsSentWeek = leads.filter((l) => {
    const dates = [l.sent_at_1, l.sent_at_2, l.sent_at_3]
      .filter(Boolean)
      .map((d) => new Date(d!));
    return dates.some((d) => d >= sevenDaysAgo);
  }).length;

  const convertedCount = leads.filter((l) => l.status === "CONVERTED").length;
  const conversionRate = totalReceived > 0 ? Math.round((convertedCount / totalReceived) * 100) : 0;

  // Handler for partial PATCH updates
  const handlePatchLead = async (leadId: string, updates: Partial<AOELead>) => {
    try {
      const res = await fetch(`/api/aoe/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update lead");
      }

      const { lead: updatedLead } = await res.json();

      // Update state list
      const nextLeads = leads.map((l) => (l.id === leadId ? updatedLead : l));
      setLeads(nextLeads);

      // Update selected lead state if it's currently open
      if (selectedLead?.id === leadId) {
        setSelectedLead(updatedLead);
      }

      return updatedLead;
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  // Handler to mark lead status directly
  const handleUpdateStatus = async (leadId: string, nextStatus: AOELeadStatus) => {
    setIsActionLoading(true);
    try {
      await handlePatchLead(leadId, { status: nextStatus });
      toast.success(`Lead status updated to ${nextStatus.replace(/_/g, " ")}`);
    } catch {
      // toast shown in helper
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handler for sending cold outreach emails via API
  const handleSendEmail = async (emailStep: number) => {
    if (!selectedLead) return;
    
    // Choose appropriate subject & body
    let subject = "";
    let body = "";

    if (emailStep === 1) {
      subject = selectedLead.selected_subject_1 || selectedLead.email_1_subject_a || "";
      body = selectedLead.edited_body_1 || selectedLead.email_1_body || "";
    } else if (emailStep === 2) {
      subject = selectedLead.selected_subject_2 || selectedLead.email_2_subject_a || "";
      body = selectedLead.edited_body_2 || selectedLead.email_2_body || "";
    } else if (emailStep === 3) {
      subject = selectedLead.selected_subject_3 || selectedLead.email_3_subject_a || "";
      body = selectedLead.edited_body_3 || selectedLead.email_3_body || "";
    }

    setIsSendingEmail((prev) => ({ ...prev, [emailStep]: true }));
    try {
      const res = await fetch("/api/aoe/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          email_step: emailStep,
          to_email: selectedLead.contact_email,
          to_name: selectedLead.contact_name,
          subject,
          body,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to send email ${emailStep}`);
      }

      toast.success(`Email ${emailStep} sent successfully via Resend!`);
      
      // Reload lead record from DB
      const { data: refreshedLead } = await supabase
        .from("aoe_leads")
        .select("*")
        .eq("id", selectedLead.id)
        .single();
      
      if (refreshedLead) {
        const nextLeads = leads.map((l) => (l.id === selectedLead.id ? refreshedLead : l));
        setLeads(nextLeads);
        setSelectedLead(refreshedLead);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSendingEmail((prev) => ({ ...prev, [emailStep]: false }));
    }
  };

  // Convert Lead to Client via conversion endpoint
  const handleConvertToClient = async () => {
    if (!selectedLead) return;
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/aoe/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: selectedLead.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to convert lead to client");
      }

      toast.success("Converted lead to client successfully!");

      // Refresh list
      const { data: refreshedLead } = await supabase
        .from("aoe_leads")
        .select("*")
        .eq("id", selectedLead.id)
        .single();
      
      if (refreshedLead) {
        const nextLeads = leads.map((l) => (l.id === selectedLead.id ? refreshedLead : l));
        setLeads(nextLeads);
        setSelectedLead(refreshedLead);
      }

      // Redirect user to client page
      setTimeout(() => {
        router.push(`/clients/${data.client_id}`);
      }, 1500);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    // Search
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (lead.company_name?.toLowerCase() || "").includes(searchLower) ||
      (lead.contact_name?.toLowerCase() || "").includes(searchLower) ||
      (lead.contact_email?.toLowerCase() || "").includes(searchLower);

    // Status Filter Tabs
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "SENT") {
        matchesStatus = ["EMAIL_1_SENT", "EMAIL_2_SENT", "EMAIL_3_SENT"].includes(lead.status);
      } else {
        matchesStatus = lead.status === statusFilter;
      }
    }

    // Confidence Filter
    const matchesConfidence =
      confidenceFilter === "all" || lead.qualification_confidence === confidenceFilter;

    return matchesSearch && matchesStatus && matchesConfidence;
  });

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "company_asc":
        return (a.company_name || "").localeCompare(b.company_name || "");
      case "confidence_desc":
        const score = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const scoreA = score[a.qualification_confidence || "LOW"];
        const scoreB = score[b.qualification_confidence || "LOW"];
        return scoreB - scoreA;
      default:
        return 0;
    }
  });

  const getConfidenceBadge = (confidence: QualificationConfidence | null) => {
    switch (confidence) {
      case "HIGH":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">HIGH</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">MEDIUM</Badge>;
      case "LOW":
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0">LOW</Badge>;
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>;
    }
  };

  const getStatusBadge = (status: AOELeadStatus) => {
    const formatted = status.replace(/_/g, " ");
    switch (status) {
      case "PENDING_REVIEW":
        return <Badge variant="outline" className="text-zinc-500 border-zinc-200 dark:border-zinc-800">Pending Review</Badge>;
      case "APPROVED":
        return <Badge className="bg-sky-500 text-white border-0">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "EMAIL_1_SENT":
        return <Badge className="bg-orange-500 text-white border-0">Email 1 Sent</Badge>;
      case "EMAIL_2_SENT":
        return <Badge className="bg-orange-600 text-white border-0">Email 2 Sent</Badge>;
      case "EMAIL_3_SENT":
        return <Badge className="bg-orange-700 text-white border-0">Email 3 Sent</Badge>;
      case "REPLIED":
        return <Badge className="bg-teal-500 text-white border-0">Replied</Badge>;
      case "CONVERTED":
        return <Badge className="bg-green-500 text-white border-0">Converted</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">{formatted}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AOE Leads</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Review and outreach sequence builder for Autonomous Outbound Engine prospects.
          </p>
        </div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500 sm:text-right bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 px-3 py-1.5 rounded-md">
          Sending Outreach via: <span className="font-semibold text-zinc-700 dark:text-zinc-300">outreach@updates.zetafo.com</span>
        </div>
      </div>

      {/* Views Toggle Tab */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveView('prospects')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-[2px] ${
            activeView === 'prospects'
              ? 'border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50'
              : 'border-transparent text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Prospects Review Queue
        </button>
        <button
          onClick={() => setActiveView('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-[2px] ${
            activeView === 'settings'
              ? 'border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50'
              : 'border-transparent text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          ICP & Engine Settings
        </button>
      </div>

      {activeView === 'prospects' && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceived}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Emails Sent (Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-500">{emailsSentWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Query bar */}
      <div className="space-y-4">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          {[
            { value: "all", label: "All" },
            { value: "PENDING_REVIEW", label: "Pending Review" },
            { value: "APPROVED", label: "Approved" },
            { value: "SENT", label: "Sent" },
            { value: "REPLIED", label: "Replied" },
            { value: "CONVERTED", label: "Converted" },
            { value: "ARCHIVED", label: "Archived" },
            { value: "REJECTED", label: "Rejected" },
          ].map((tab) => {
            const isTabActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  isTabActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Inputs row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search company or contact..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Confidence Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Confidence:</span>
              <Select value={confidenceFilter} onValueChange={(val) => setConfidenceFilter(val || "all")}>
                <SelectTrigger className="w-[120px] text-xs h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Sort:</span>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val || "newest")}>
                <SelectTrigger className="w-[160px] text-xs h-9">
                  <SelectValue placeholder="Newest first" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="company_asc">Company A-Z</SelectItem>
                  <SelectItem value="confidence_desc">Confidence (HIGH first)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Confidence</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeads.length > 0 ? (
              sortedLeads.map((lead) => {
                const canReview = lead.status === "PENDING_REVIEW";
                const isApproved = lead.status === "APPROVED";
                const isEmail1Sent = lead.status === "EMAIL_1_SENT";
                const isEmail2Sent = lead.status === "EMAIL_2_SENT";
                const isEmail3Sent = lead.status === "EMAIL_3_SENT";
                const isReplied = lead.status === "REPLIED";
                const isConverted = lead.status === "CONVERTED";
                const isRejectedOrArchived = ["REJECTED", "ARCHIVED"].includes(lead.status);

                return (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {getConfidenceBadge(lead.qualification_confidence)}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-50">
                      <div>{lead.company_name}</div>
                      {lead.company_url && (
                        <a
                          href={lead.company_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-[#E8400C] dark:hover:text-[#E8400C] mt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.company_url.replace(/^https?:\/\/(www\.)?/, "")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-zinc-700 dark:text-zinc-300">{lead.contact_name || "-"}</div>
                      {lead.contact_title && (
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">{lead.contact_title}</div>
                      )}
                      {lead.contact_email && (
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{lead.contact_email}</div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell className="text-zinc-500 text-xs">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {canReview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                        >
                          Review
                        </Button>
                      )}
                      {isApproved && (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => setSelectedLead(lead)}
                        >
                          Send Email 1
                        </Button>
                      )}
                      {isEmail1Sent && (
                        <Button
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => setSelectedLead(lead)}
                        >
                          Send Email 2
                        </Button>
                      )}
                      {isEmail2Sent && (
                        <Button
                          size="sm"
                          className="bg-orange-700 hover:bg-orange-850 text-white"
                          onClick={() => setSelectedLead(lead)}
                        >
                          Send Email 3
                        </Button>
                      )}
                      {isEmail3Sent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(lead.id, "REPLIED")}
                        >
                          Mark Replied?
                        </Button>
                      )}
                      {isReplied && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setSelectedLead(lead)}
                        >
                          Convert to Client
                        </Button>
                      )}
                      {isConverted && lead.converted_to_client_id && (
                        <Link href={`/clients/${lead.converted_to_client_id}`}>
                          <Button variant="link" size="sm" className="text-[#E8400C] dark:text-[#E8400C]">
                            View Client <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                      {isRejectedOrArchived && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">Archived</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-zinc-400 dark:text-zinc-500">
                  No prospects matched the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
        </>
      )}

      {activeView === 'settings' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main settings column */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-base font-semibold">ICP Matching Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Target Industries</label>
                    <Input 
                      placeholder="e.g. SaaS, Tech, DevOps"
                      value={targetIndustries}
                      onChange={(e) => setTargetIndustries(e.target.value)}
                    />
                    <p className="text-[10px] text-zinc-400">Comma-separated list of target industries.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Excluded Industries</label>
                    <Input 
                      placeholder="e.g. Gaming, Retail"
                      value={excludedIndustries}
                      onChange={(e) => setExcludedIndustries(e.target.value)}
                    />
                    <p className="text-[10px] text-zinc-400">Industries to exclude during screening.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Target Geographies</label>
                    <Input 
                      placeholder="e.g. US, Europe, Canada"
                      value={targetGeographies}
                      onChange={(e) => setTargetGeographies(e.target.value)}
                    />
                    <p className="text-[10px] text-zinc-400">Target locations for qualification.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Excluded Keywords</label>
                    <Input 
                      placeholder="e.g. Crypto, Gambling"
                      value={excludedKeywords}
                      onChange={(e) => setExcludedKeywords(e.target.value)}
                    />
                    <p className="text-[10px] text-zinc-400">Exclude leads containing these keywords.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">ICP Description</label>
                  <Textarea 
                    rows={4}
                    placeholder="Describe your ideal client profile..."
                    value={icpDescription}
                    onChange={(e) => setIcpDescription(e.target.value)}
                  />
                  <p className="text-[11px] text-zinc-400">Core parameters the LLM uses to score leads from 0 to 100.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Service Pitch Framework</label>
                  <Textarea 
                    rows={4}
                    placeholder="Describe your service framework..."
                    value={serviceFramework}
                    onChange={(e) => setServiceFramework(e.target.value)}
                  />
                  <p className="text-[11px] text-zinc-400">Your core services pitch used by Gemini to generate relevant outreach emails.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar status toggles */}
          <div className="space-y-6">
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Engine Activation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border border-zinc-100 dark:border-zinc-900 rounded-lg p-4 bg-zinc-50/50 dark:bg-zinc-900/10">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {isActive ? 'AOE Pipeline Active' : 'AOE Pipeline Paused'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {isActive ? 'Pipeline is active and processing events.' : 'Leads will be marked as DISQUALIFIED upon ingest.'}
                      </div>
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant={isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => setIsActive(!isActive)}
                        className="gap-2 text-xs"
                      >
                        {isActive ? (
                          <>
                            <Pause className="h-3.5 w-3.5" />
                            Pause Engine
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" />
                            Activate Engine
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 p-3.5 rounded-md leading-relaxed">
                    💡 **How to trigger the AOE:** Send a CSV upload file or POST raw JSON leads to `/api/ingest/webhook` with the `X-Ingest-Secret` header set.
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4 flex justify-end">
                  <Button 
                    type="button"
                    onClick={handleSaveIcp} 
                    disabled={isSavingIcp} 
                    className="gap-2 bg-[#E8400C] hover:bg-[#E8400C]/90 text-white"
                  >
                    {isSavingIcp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Configurations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* AOE Lead Details Sheet Panel */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-6">
          {selectedLead && (
            <>
              {/* Sheet Header */}
              <SheetHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <SheetTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {selectedLead.company_name}
                    </SheetTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {getStatusBadge(selectedLead.status)}
                      {getConfidenceBadge(selectedLead.qualification_confidence)}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* SECTION 1: CONTACT INFO */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase font-mono">
                  [ Contact Details ]
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-150 dark:border-zinc-800/40">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Name
                    </label>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {selectedLead.contact_name || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Title
                    </label>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {selectedLead.contact_title || "-"}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Email
                    </label>
                    {selectedLead.contact_email ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <a
                          href={`mailto:${selectedLead.contact_email}`}
                          className="text-xs text-[#E8400C] dark:text-[#E8400C] hover:underline font-semibold"
                        >
                          {selectedLead.contact_email}
                        </a>
                        <button
                          onClick={() => handleCopyEmail(selectedLead.contact_email!)}
                          className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-350"
                        >
                          {copiedEmail ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">-</p>
                    )}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Website URL
                    </label>
                    {selectedLead.company_url ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <a
                          href={selectedLead.company_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold hover:underline flex items-center gap-1 text-zinc-700 dark:text-zinc-300"
                        >
                          {selectedLead.company_url.replace(/^https?:\/\/(www\.)?/, "")}
                          <ExternalLink className="h-3 w-3 text-zinc-400" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">-</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: COMPANY INTELLIGENCE */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase font-mono">
                  [ AOE Intelligence ]
                </h3>
                <div className="space-y-4">
                  {selectedLead.strategic_hook && (
                    <div className="border-l-2 border-orange-500 bg-orange-50/20 dark:bg-orange-950/5 p-4 rounded-r-lg">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-orange-500 text-sm">★</span>
                        <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider font-mono">
                          Strategic Hook
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                        &ldquo;{selectedLead.strategic_hook}&rdquo;
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 italic font-mono">
                        This is the customized outbound angle AOE selected as the strongest opener.
                      </p>
                    </div>
                  )}

                  {selectedLead.value_proposition && (
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                        Value Proposition
                      </span>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                        {selectedLead.value_proposition}
                      </p>
                    </div>
                  )}

                  {selectedLead.primary_pain_point && (
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                        Primary Pain Point
                      </span>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                        {selectedLead.primary_pain_point}
                      </p>
                    </div>
                  )}

                  {selectedLead.target_audience && (
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                        Target Audience
                      </span>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                        {selectedLead.target_audience}
                      </p>
                    </div>
                  )}

                  {selectedLead.scaling_signals && (
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                        Scaling Signals
                      </span>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                        {selectedLead.scaling_signals}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: QUALIFICATION */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase font-mono">
                  [ Qualification ]
                </h3>
                <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-150 dark:border-zinc-800/40">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Reasoning
                    </span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                      {selectedLead.qualification_reason || "No detail reason provided."}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {selectedLead.tier_1_passed ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-500" />
                          <span className="text-zinc-700 dark:text-zinc-300">Tier 1 Passed</span>
                        </>
                      ) : (
                        <>
                          <span className="text-rose-500 text-sm font-bold">✗</span>
                          <span className="text-zinc-400">Tier 1 Failed</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {selectedLead.tier_2_passed ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-500" />
                          <span className="text-zinc-700 dark:text-zinc-300">Tier 2 Passed</span>
                        </>
                      ) : (
                        <>
                          <span className="text-rose-500 text-sm font-bold">✗</span>
                          <span className="text-zinc-400">Tier 2 Failed</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: EMAIL SEQUENCE */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase font-mono">
                  [ Email Sequence ]
                </h3>
                
                {[1, 2, 3].map((step) => {
                  const sentKey = `sent_at_${step}` as keyof AOELead;
                  const sentTimestamp = selectedLead[sentKey] as string | null;
                  
                  const subAKey = `email_${step}_subject_a` as keyof AOELead;
                  const subBKey = `email_${step}_subject_b` as keyof AOELead;
                  const bodyKey = `email_${step}_body` as keyof AOELead;
                  const selSubKey = `selected_subject_${step}` as keyof AOELead;
                  const editBodyKey = `edited_body_${step}` as keyof AOELead;

                  const subjectA = (selectedLead[subAKey] as string) || "";
                  const subjectB = (selectedLead[subBKey] as string) || "";
                  const originalBody = (selectedLead[bodyKey] as string) || "";
                  
                  const selectedSubject = (selectedLead[selSubKey] as string) || subjectA;
                  const currentBody = (selectedLead[editBodyKey] as string) || originalBody;

                  // Disabled conditions for send button
                  const isPrevUnsent =
                    step === 2 ? !selectedLead.sent_at_1 :
                    step === 3 ? !selectedLead.sent_at_2 : false;
                  
                  const isLeadArchivedOrRejected = ["ARCHIVED", "REJECTED"].includes(selectedLead.status);
                  const isLeadPendingReview = selectedLead.status === "PENDING_REVIEW";
                  
                  const canSend = !sentTimestamp && !isPrevUnsent && !isLeadArchivedOrRejected && !isLeadPendingReview;

                  // Schedule helper tags
                  const scheduleLabel = step === 1 ? "Send immediately" : step === 2 ? "Send Day 3" : "Send Day 5";

                  return (
                    <div key={step} className="space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
                      {/* Step Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-zinc-850 dark:text-zinc-200">Email {step}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">({scheduleLabel})</span>
                        </div>
                        {sentTimestamp ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Sent {new Date(sentTimestamp).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 font-mono">Not sent</span>
                        )}
                      </div>

                      {/* Subject toggles */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                          Subject Variant Selector
                        </span>
                        <div className="space-y-2">
                          <label className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                            <input
                              type="radio"
                              name={`subject-${selectedLead.id}-${step}`}
                              checked={selectedSubject === subjectA}
                              disabled={!!sentTimestamp}
                              onChange={() => handlePatchLead(selectedLead.id, { [selSubKey]: subjectA })}
                              className="mt-0.5 accent-[#E8400C]"
                            />
                            <span>
                              <span className="font-semibold text-zinc-500 mr-1">Subject A:</span>
                              {subjectA}
                            </span>
                          </label>
                          <label className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                            <input
                              type="radio"
                              name={`subject-${selectedLead.id}-${step}`}
                              checked={selectedSubject === subjectB}
                              disabled={!!sentTimestamp}
                              onChange={() => handlePatchLead(selectedLead.id, { [selSubKey]: subjectB })}
                              className="mt-0.5 accent-[#E8400C]"
                            />
                            <span>
                              <span className="font-semibold text-zinc-500 mr-1">Subject B:</span>
                              {subjectB}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Body Edit Textarea */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                            Body Draft
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {currentBody.length} chars
                          </span>
                        </div>
                        <Textarea
                          disabled={!!sentTimestamp}
                          defaultValue={currentBody}
                          rows={8}
                          className="font-mono text-xs leading-relaxed resize-y border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20"
                          placeholder="Write outbound cold outreach mail content..."
                          onBlur={(e) => {
                            if (e.target.value !== currentBody) {
                              handlePatchLead(selectedLead.id, { [editBodyKey]: e.target.value });
                              toast.info(`Email ${step} draft saved`);
                            }
                          }}
                        />
                      </div>

                      {/* Send Button */}
                      {!sentTimestamp && (
                        <div className="pt-1 flex items-center justify-between">
                          {isPrevUnsent && (
                            <span className="text-[11px] text-rose-500 dark:text-rose-400 font-mono flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Email {step - 1} must be sent first
                            </span>
                          )}
                          {isLeadPendingReview && (
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
                              Approve prospect first to enable outbound
                            </span>
                          )}
                          {isLeadArchivedOrRejected && (
                            <span className="text-[11px] text-rose-500/80 italic">
                              Lead is rejected or archived
                            </span>
                          )}
                          
                          <Button
                            className="bg-[#E8400C] hover:bg-[#E8400C]/90 text-white text-xs h-8 ml-auto"
                            disabled={!canSend || isSendingEmail[step]}
                            onClick={() => handleSendEmail(step)}
                          >
                            {isSendingEmail[step] ? (
                              <>
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>Send Email {step} →</>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SECTION 5: INTERNAL NOTES */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                    Internal Notes
                  </span>
                  {notesSaveStatus === "saving" && <span className="text-[10px] text-zinc-400 animate-pulse font-mono">Saving...</span>}
                  {notesSaveStatus === "saved" && <span className="text-[10px] text-green-500 font-semibold font-mono">Saved ✓</span>}
                </div>
                <Textarea
                  placeholder="Add notes about this prospect..."
                  defaultValue={selectedLead.notes || ""}
                  rows={4}
                  className="text-xs resize-none"
                  onBlur={async (e) => {
                    if (e.target.value !== (selectedLead.notes || "")) {
                      setNotesSaveStatus("saving");
                      try {
                        await handlePatchLead(selectedLead.id, { notes: e.target.value });
                        setNotesSaveStatus("saved");
                        setTimeout(() => setNotesSaveStatus("idle"), 2000);
                      } catch {
                        setNotesSaveStatus("idle");
                      }
                    }
                  }}
                />
              </div>

              {/* SECTION 6: STICKY FOOTER ACTIONS */}
              <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  {selectedLead.status === "PENDING_REVIEW" && (
                    <>
                      <Button
                        className="flex-1 bg-[#E8400C] hover:bg-[#E8400C]/90 text-white"
                        disabled={isActionLoading}
                        onClick={() => handleUpdateStatus(selectedLead.id, "APPROVED")}
                      >
                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                      </Button>
                      <Button
                        variant="outline"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-zinc-200"
                        disabled={isActionLoading}
                        onClick={() => {
                          if (confirm("Are you sure you want to reject this lead?")) {
                            handleUpdateStatus(selectedLead.id, "REJECTED");
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {selectedLead.status === "REPLIED" && (
                    <Button
                      className="w-full bg-[#E8400C] hover:bg-[#E8400C]/90 text-white"
                      disabled={isActionLoading}
                      onClick={handleConvertToClient}
                    >
                      {isActionLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        "Convert to Client"
                      )}
                    </Button>
                  )}

                  {selectedLead.status === "CONVERTED" && selectedLead.converted_to_client_id && (
                    <Link href={`/clients/${selectedLead.converted_to_client_id}`} className="w-full">
                      <Button variant="outline" className="w-full border-zinc-200">
                        View Client <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  )}

                  {["APPROVED", "EMAIL_1_SENT", "EMAIL_2_SENT"].includes(selectedLead.status) && (
                    <Button
                      variant="outline"
                      className="w-full border-zinc-200"
                      disabled={isActionLoading}
                      onClick={() => handleUpdateStatus(selectedLead.id, "REPLIED")}
                    >
                      Mark as Replied
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                  {selectedLead.status !== "CONVERTED" ? (
                    <button
                      className="hover:underline font-semibold hover:text-zinc-600 dark:hover:text-zinc-300"
                      onClick={() => {
                        if (confirm("Are you sure you want to archive this lead?")) {
                          handleUpdateStatus(selectedLead.id, "ARCHIVED");
                        }
                      }}
                    >
                      Archive Lead
                    </button>
                  ) : (
                    <span />
                  )}

                  {selectedLead.status === "REJECTED" && (
                    <button
                      className="hover:underline font-semibold hover:text-[#E8400C]"
                      onClick={() => handleUpdateStatus(selectedLead.id, "PENDING_REVIEW")}
                    >
                      Restore to Pending
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
