"use client";

import { useState } from "react";
import { format, isBefore, isToday, parseISO } from "date-fns";
import Papa from "papaparse";
import { UserSearch, Search, Plus, Filter, Upload, Edit, Trash, ArrowRight, UserPlus, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Lead, Profile } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { PIPELINE_STAGES } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import React from "react";

interface LeadListClientProps {
  initialLeads: Lead[];
  profiles: Profile[];
  currentUserId: string;
}

const LEAD_SOURCES = [
  { value: "outbound", label: "Outbound" },
  { value: "referral", label: "Referral" },
  { value: "inbound", label: "Inbound" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

const LEAD_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "responded", label: "Responded", color: "bg-purple-500" },
  { value: "qualified", label: "Qualified", color: "bg-[#E8400C]" },
  { value: "converted", label: "Converted", color: "bg-green-500" },
  { value: "dead", label: "Dead", color: "bg-zinc-500" },
];

export function LeadListClient({ initialLeads, profiles, currentUserId }: LeadListClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  
  const [leadForm, setLeadForm] = useState<Partial<Lead>>({
    status: 'new',
    source: 'inbound',
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [convertForm, setConvertForm] = useState({
    leadId: '',
    company_name: '',
    contact_name: '',
    contact_email: '',
    pipeline_stage: 'discovery',
    pipeline_value: 0,
  });
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [scanningLeads, setScanningLeads] = useState<Record<string, boolean>>({});

  const handleScanLead = async (leadId: string) => {
    setScanningLeads((prev) => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetch("/api/aoe/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger scan");
      }

      toast.success(data.message || "Lead successfully queued in the AOE pipeline!");
    } catch (err: any) {
      toast.error(err.message || "Failed to scan lead with AOE");
    } finally {
      setScanningLeads((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (lead.contact_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (lead.contact_email?.toLowerCase() || '').includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    needsFollowUp: leads.filter(l => 
      l.follow_up_date && 
      !['converted', 'dead'].includes(l.status) &&
      (isBefore(parseISO(l.follow_up_date), new Date()) || isToday(parseISO(l.follow_up_date)))
    ).length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    convertedThisMonth: leads.filter(l => 
      l.status === 'converted' && 
      new Date(l.updated_at).getMonth() === new Date().getMonth()
    ).length
  };

  const formatUSD = (val: number | null | undefined) => {
    if (!val) return "-";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusObj = (status: string) => LEAD_STATUSES.find(s => s.value === status);
  const getSourceLabel = (source: string) => LEAD_SOURCES.find(s => s.value === source)?.label || source;

  const handleAddLead = async () => {
    if (!leadForm.company_name) {
      toast.error("Company name is required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          ...leadForm,
          created_by: currentUserId
        }])
        .select()
        .single();

      if (error) throw error;

      setLeads([data as Lead, ...leads]);
      setIsAddLeadOpen(false);
      setLeadForm({ status: 'new', source: 'inbound' });
      toast.success("Lead added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add lead");
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes })
        .eq('id', id);

      if (error) throw error;
      setLeads(leads.map(l => l.id === id ? { ...l, notes } : l));
    } catch (error: any) {
      toast.error("Failed to update notes");
    }
  };

  const handleConvertLead = async () => {
    if (!convertForm.company_name) {
      toast.error("Company name is required");
      return;
    }

    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{
          company_name: convertForm.company_name,
          contact_name: convertForm.contact_name,
          contact_email: convertForm.contact_email,
          pipeline_stage: convertForm.pipeline_stage,
          pipeline_value: convertForm.pipeline_value,
          created_by: currentUserId,
          retainer_active: false
        }])
        .select()
        .single();

      if (clientError) throw clientError;

      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_to: clientData.id
        })
        .eq('id', convertForm.leadId);

      if (leadError) throw leadError;

      await supabase
        .from('activities')
        .insert([{
          client_id: clientData.id,
          created_by: currentUserId,
          type: 'note',
          content: 'Converted from lead',
          timestamp: new Date().toISOString()
        }]);

      toast.success(`${clientData.company_name} converted to client!`);
      router.push(`/clients/${clientData.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to convert lead");
    }
  };

  const handleImportCSV = async () => {
    if (!importFile) return;

    Papa.parse(importFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedLeads = results.data.map((row: any) => ({
          company_name: row.company_name || row.Company || 'Unknown',
          contact_name: row.contact_name || row.Contact || null,
          contact_email: row.contact_email || row.Email || null,
          source: row.source || 'inbound',
          estimated_value: parseFloat(row.estimated_value || '0') || null,
          notes: row.notes || null,
          created_by: currentUserId,
          status: 'new'
        }));

        try {
          const { data, error } = await supabase
            .from('leads')
            .insert(parsedLeads)
            .select();

          if (error) throw error;

          setLeads([...(data as Lead[]), ...leads]);
          setIsImportOpen(false);
          setImportFile(null);
          toast.success(`Successfully imported ${parsedLeads.length} leads`);
        } catch (error: any) {
          toast.error(error.message || "Import failed");
        }
      }
    });
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      
      setLeads(leads.filter(l => l.id !== id));
      toast.success("Lead deleted");
    } catch (error: any) {
      toast.error("Failed to delete lead");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button className="bg-[#E8400C] hover:bg-[#E8400C]/90 text-white" onClick={() => setIsAddLeadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: stats.total },
          { label: "Needs Follow-up", value: stats.needsFollowUp, highlight: stats.needsFollowUp > 0 },
          { label: "Qualified", value: stats.qualified },
          { label: "Converted This Month", value: stats.convertedThisMonth },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-sm font-medium text-zinc-500">{stat.label}</div>
            <div className={`mt-1 text-2xl font-bold ${stat.highlight ? 'text-[#E8400C]' : 'text-zinc-900 dark:text-zinc-100'}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="All Statuses" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Est. Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => {
                const statusObj = getStatusObj(lead.status);
                const needsFollowUp = lead.follow_up_date && !['converted', 'dead'].includes(lead.status) && isBefore(parseISO(lead.follow_up_date), new Date());
                const followUpToday = lead.follow_up_date && !['converted', 'dead'].includes(lead.status) && isToday(parseISO(lead.follow_up_date));
                
                let rowBorder = "";
                if (needsFollowUp) rowBorder = "border-l-4 border-l-red-500";
                else if (followUpToday) rowBorder = "border-l-4 border-l-orange-400";
                else rowBorder = "border-l-4 border-l-transparent";

                return (
                  <React.Fragment key={lead.id}>
                    <TableRow className={`cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${rowBorder}`} onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}>
                      <TableCell className="font-medium">{lead.company_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{lead.contact_name || "-"}</div>
                        <div className="text-xs text-zinc-500">{lead.contact_email}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{getSourceLabel(lead.source)}</Badge></TableCell>
                      <TableCell>{formatUSD(lead.estimated_value)}</TableCell>
                      <TableCell>
                        <Badge className={`${statusObj?.color} text-white border-transparent`}>{statusObj?.label}</Badge>
                      </TableCell>
                      <TableCell className={`text-sm ${needsFollowUp ? 'text-red-500 font-medium' : 'text-zinc-500'}`}>
                        {lead.follow_up_date ? format(parseISO(lead.follow_up_date), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {lead.status !== 'converted' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={scanningLeads[lead.id]}
                              onClick={() => handleScanLead(lead.id)}
                              title="Scan with AOE Outbound Builder"
                            >
                              {scanningLeads[lead.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin text-[#E8400C]" />
                              ) : (
                                <Zap className="h-4 w-4 text-[#E8400C]" />
                              )}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setConvertForm({
                                leadId: lead.id,
                                company_name: lead.company_name,
                                contact_name: lead.contact_name || '',
                                contact_email: lead.contact_email || '',
                                pipeline_stage: 'discovery',
                                pipeline_value: lead.estimated_value || 0
                              });
                              setIsConvertOpen(true);
                            }}>
                              <ArrowRight className="h-4 w-4 text-emerald-500" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteLead(lead.id)}>
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedLeadId === lead.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-zinc-50/50 dark:bg-zinc-900/20 p-4">
                          <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs text-zinc-500 uppercase">Notes</Label>
                              <Textarea 
                                defaultValue={lead.notes || ""} 
                                className="min-h-[100px] bg-white dark:bg-zinc-950"
                                onBlur={(e) => handleUpdateNotes(lead.id, e.target.value)}
                                placeholder="Add notes here (auto-saves on blur)..."
                              />
                            </div>
                            <div className="w-64 space-y-2 border-l pl-4 dark:border-zinc-800">
                              <Label className="text-xs text-zinc-500 uppercase">Lead Details</Label>
                              <div className="text-sm space-y-1">
                                {lead.industry && <p><span className="text-zinc-500">Industry:</span> {lead.industry}</p>}
                                {lead.contact_linkedin && <p><span className="text-zinc-500">LinkedIn:</span> <a href={lead.contact_linkedin} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Profile</a></p>}
                                <p><span className="text-zinc-500">Created:</span> {format(new Date(lead.created_at), "MMM d, yyyy")}</p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Create a new prospect for the pipeline.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Company Name *</Label>
              <Input 
                value={leadForm.company_name || ""} 
                onChange={e => setLeadForm({...leadForm, company_name: e.target.value})} 
                placeholder="Acme Corp" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contact Name</Label>
                <Input value={leadForm.contact_name || ""} onChange={e => setLeadForm({...leadForm, contact_name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Contact Email</Label>
                <Input type="email" value={leadForm.contact_email || ""} onChange={e => setLeadForm({...leadForm, contact_email: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Source *</Label>
                <Select value={leadForm.source} onValueChange={v => setLeadForm({...leadForm, source: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status *</Label>
                <Select value={leadForm.status} onValueChange={v => setLeadForm({...leadForm, status: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Estimated Value ($)</Label>
                <Input type="number" value={leadForm.estimated_value || ""} onChange={e => setLeadForm({...leadForm, estimated_value: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="grid gap-2">
                <Label>Follow-up Date</Label>
                <Input type="date" value={leadForm.follow_up_date || ""} onChange={e => setLeadForm({...leadForm, follow_up_date: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLeadOpen(false)}>Cancel</Button>
            <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90" onClick={handleAddLead}>Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Convert to Client</DialogTitle>
            <DialogDescription>Move this lead into the active client CRM.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Company Name *</Label>
              <Input value={convertForm.company_name} onChange={e => setConvertForm({...convertForm, company_name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contact Name</Label>
                <Input value={convertForm.contact_name} onChange={e => setConvertForm({...convertForm, contact_name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Contact Email</Label>
                <Input value={convertForm.contact_email} onChange={e => setConvertForm({...convertForm, contact_email: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Pipeline Stage</Label>
                <Select value={convertForm.pipeline_stage} onValueChange={v => setConvertForm({...convertForm, pipeline_stage: v || 'discovery'})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.filter(s => s.value !== 'inactive' && s.value !== 'churned').map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Pipeline Value ($)</Label>
                <Input type="number" value={convertForm.pipeline_value} onChange={e => setConvertForm({...convertForm, pipeline_value: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleConvertLead}>
              <UserPlus className="mr-2 h-4 w-4" /> Convert to Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
            <DialogDescription>Upload a CSV file containing lead data.</DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
            <input 
              type="file" 
              accept=".csv" 
              className="mb-4 text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-zinc-500 text-center max-w-sm">
              Expected columns: company_name, contact_name, contact_email, source, estimated_value, notes
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancel</Button>
            <Button onClick={handleImportCSV} disabled={!importFile}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
