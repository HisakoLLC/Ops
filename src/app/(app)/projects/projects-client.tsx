"use client";

import { useState } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { Project, Client } from "@/types";
import { Plus, LayoutDashboard, Search, Settings, AlertCircle, PlaySquare, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ProjectsClient({ initialProjects, clients }: { initialProjects: any[], clients: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState<any[]>(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");

  const [form, setForm] = useState<Partial<Project>>({
    phase: 'map',
    status: 'on_track',
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'on_track': return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
      case 'at_risk': return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case 'delayed': return "bg-red-100 text-red-800 hover:bg-red-100";
      case 'complete': return "bg-zinc-100 text-zinc-800 hover:bg-zinc-100";
      default: return "";
    }
  };

  const getPhaseBadge = (phase: string) => {
    return <Badge variant="outline" className="capitalize">{phase}</Badge>;
  };

  const handleSave = async () => {
    if (!form.name || !form.client_id) {
      toast.error("Name and Client are required");
      return;
    }
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        ...form,
        created_by: userData.user?.id,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([payload])
        .select('*, clients(company_name), tasks(id, status)')
        .single();
        
      if (error) throw error;
      
      toast.success("Project created");
      setProjects([data, ...projects]);
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.clients?.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPhase = phaseFilter === 'all' || p.phase === phaseFilter;
    return matchesSearch && matchesStatus && matchesPhase;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90" onClick={() => {
          setForm({ phase: 'map', status: 'on_track' });
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Search projects or clients..." 
            className="pl-9 bg-white dark:bg-zinc-950" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
          <SelectTrigger className="w-[150px] bg-white dark:bg-zinc-950">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="on_track">On Track</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={phaseFilter} onValueChange={(v) => setPhaseFilter(v || 'all')}>
          <SelectTrigger className="w-[150px] bg-white dark:bg-zinc-950">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="map">Map</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="build">Build</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="retainer">Retainer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Target Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => {
              const tasks = p.tasks || [];
              const doneCount = tasks.filter((t: any) => t.status === 'done').length;
              const daysLeft = p.target_end_date ? differenceInDays(parseISO(p.target_end_date), new Date()) : null;
              
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link href={`/projects/${p.id}`} className="hover:underline text-zinc-900 dark:text-zinc-100">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${p.client_id}`} className="text-zinc-500 hover:text-zinc-900 hover:underline">
                      {p.clients?.company_name}
                    </Link>
                  </TableCell>
                  <TableCell>{getPhaseBadge(p.phase)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(p.status)}>
                      {p.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    {doneCount} / {tasks.length} tasks
                  </TableCell>
                  <TableCell>
                    {p.target_end_date ? (
                      <div className="flex flex-col">
                        <span>{format(parseISO(p.target_end_date), 'MMM d, yyyy')}</span>
                        {daysLeft !== null && daysLeft >= 0 && <span className="text-xs text-zinc-400">{daysLeft} days left</span>}
                        {daysLeft !== null && daysLeft < 0 && <span className="text-xs text-red-500">{Math.abs(daysLeft)} days overdue</span>}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${p.id}`)}>
                      View <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center h-32">No projects found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>Create a new project workspace.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Project Name *</Label>
              <Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Website Build" />
            </div>
            <div className="grid gap-2">
              <Label>Client *</Label>
              <Select value={form.client_id || ''} onValueChange={v => setForm({...form, client_id: v ?? undefined})}>
                <SelectTrigger><SelectValue placeholder="Select Client">{clients.find(c => c.id === form.client_id)?.company_name}</SelectValue></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Phase</Label>
                <Select value={form.phase} onValueChange={v => setForm({...form, phase: (v as any) ?? undefined})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="map">Map</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="build">Build</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="retainer">Retainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: (v as any) ?? undefined})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_track">On Track</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Target End Date</Label>
                <Input type="date" value={form.target_end_date || ''} onChange={e => setForm({...form, target_end_date: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90" onClick={handleSave}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
