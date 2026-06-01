"use client";

import { useState } from "react";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { Plus, Download, Edit, Trash, PlaySquare, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

export function TimeClient({ 
  initialEntries, clients, projects, tasks, teamProfiles, currentUserId, isAdmin 
}: { 
  initialEntries: any[], clients: any[], projects: any[], tasks: any[], teamProfiles: any[], currentUserId: string, isAdmin: boolean 
}) {
  const supabase = createClient();
  const [entries, setEntries] = useState<any[]>(initialEntries);
  
  const [clientFilter, setClientFilter] = useState("all");

  const [form, setForm] = useState({
    client_id: '',
    project_id: '',
    task_id: '',
    description: '',
    hours: 1,
    date: format(new Date(), 'yyyy-MM-dd'),
    billable: true
  });

  const handleLogTime = async () => {
    if (!form.client_id || !form.description || form.hours <= 0) {
      toast.error("Client, description, and positive hours are required");
      return;
    }

    const payload = {
      ...form,
      project_id: form.project_id || null,
      task_id: form.task_id || null,
      logged_by: currentUserId
    };

    const { data, error } = await supabase
      .from('time_entries')
      .insert([payload])
      .select('*, clients(id, company_name), projects(id, name), tasks(id, title), profiles:logged_by(id, full_name, avatar_url)')
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Time logged successfully");
      setEntries([data, ...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setForm({ ...form, description: '', hours: 1 });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this time entry?")) return;
    const { error } = await supabase.from('time_entries').delete().eq('id', id);
    if (error) toast.error("Failed to delete entry");
    else {
      toast.success("Entry deleted");
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const weekEntries = entries.filter(e => isWithinInterval(parseISO(e.date), { start: weekStart, end: weekEnd }));
  const weekTotal = weekEntries.reduce((acc, e) => acc + Number(e.hours), 0);
  const weekBillable = weekEntries.filter(e => e.billable).reduce((acc, e) => acc + Number(e.hours), 0);
  const weekUnbillable = weekTotal - weekBillable;
  const avgHoursDay = weekTotal / 5; // Assume 5 work days

  // Group by date
  const filteredEntries = clientFilter === 'all' ? entries : entries.filter(e => e.client_id === clientFilter);
  const grouped = filteredEntries.reduce((acc: any, entry: any) => {
    if (!acc[entry.date]) acc[entry.date] = { total: 0, items: [] };
    acc[entry.date].items.push(entry);
    acc[entry.date].total += Number(entry.hours);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Time Tracker</h1>
        {isAdmin && (
          <Button variant="outline" onClick={() => window.location.href = "/time/reports"}>
            <Download className="mr-2 h-4 w-4" /> Reports
          </Button>
        )}
      </div>

      {/* QUICK LOG FORM */}
      <Card className="sticky top-4 z-10 shadow-sm border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="grid gap-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider">Client</Label>
            <Select value={form.client_id} onValueChange={v => setForm({...form, client_id: v, project_id: '', task_id: ''})}>
              <SelectTrigger><SelectValue placeholder="Select Client" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-1.5 flex-1 min-w-[150px]">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider">Project</Label>
            <Select value={form.project_id || 'none'} onValueChange={v => setForm({...form, project_id: v === 'none' ? '' : v, task_id: ''})} disabled={!form.client_id}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.filter(p => p.client_id === form.client_id).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5 flex-[2] min-w-[250px]">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider">Description</Label>
            <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What did you work on?" />
          </div>

          <div className="grid gap-1.5 w-[100px]">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider">Hours</Label>
            <Input type="number" step="0.25" min="0.25" max="24" value={form.hours} onChange={e => setForm({...form, hours: parseFloat(e.target.value) || 0})} />
          </div>

          <div className="grid gap-1.5 w-[140px]">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider">Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
          </div>

          <div className="flex items-center gap-2 h-10 px-2">
            <Switch checked={form.billable} onCheckedChange={c => setForm({...form, billable: c})} />
            <Label className="text-sm cursor-pointer whitespace-nowrap">Billable</Label>
          </div>

          <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90 h-10 w-full sm:w-auto" onClick={handleLogTime}>
            Log Time
          </Button>
        </CardContent>
      </Card>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border bg-white dark:bg-zinc-950 p-4 rounded-xl shadow-sm">
          <div className="text-sm font-medium text-zinc-500 mb-1">This Week</div>
          <div className="text-2xl font-bold">{weekTotal.toFixed(2)} <span className="text-sm font-normal text-zinc-500">hrs</span></div>
        </div>
        <div className="border bg-white dark:bg-zinc-950 p-4 rounded-xl shadow-sm">
          <div className="text-sm font-medium text-emerald-600 mb-1">Billable</div>
          <div className="text-2xl font-bold">{weekBillable.toFixed(2)} <span className="text-sm font-normal text-zinc-500">hrs</span></div>
        </div>
        <div className="border bg-white dark:bg-zinc-950 p-4 rounded-xl shadow-sm">
          <div className="text-sm font-medium text-zinc-500 mb-1">Unbillable</div>
          <div className="text-2xl font-bold">{weekUnbillable.toFixed(2)} <span className="text-sm font-normal text-zinc-500">hrs</span></div>
        </div>
        <div className="border bg-white dark:bg-zinc-950 p-4 rounded-xl shadow-sm">
          <div className="text-sm font-medium text-zinc-500 mb-1">Avg / Day</div>
          <div className="text-2xl font-bold">{avgHoursDay.toFixed(2)} <span className="text-sm font-normal text-zinc-500">hrs</span></div>
        </div>
      </div>

      <div className="flex justify-end">
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by Client" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* TIME LOG TABLE */}
      <div className="space-y-6 pb-20">
        {sortedDates.map(dateStr => {
          const group = grouped[dateStr];
          return (
            <div key={dateStr} className="rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div className="font-semibold text-sm flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-zinc-400" />
                  {format(parseISO(dateStr), 'EEEE, MMM d, yyyy')}
                </div>
                <div className="font-bold text-sm bg-white dark:bg-zinc-950 px-2 py-0.5 rounded border shadow-sm">
                  {group.total.toFixed(2)} hrs
                </div>
              </div>
              <Table>
                <TableBody>
                  {group.items.map((entry: any) => (
                    <TableRow key={entry.id} className="group">
                      <TableCell className="w-[180px]">
                        <div className="font-medium">
                          <Link href={`/clients/${entry.client_id}`} className="hover:underline hover:text-[#E8400C]">
                            {entry.clients?.company_name}
                          </Link>
                        </div>
                        {entry.projects && <div className="text-xs text-zinc-500 truncate">{entry.projects.name}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{entry.description}</div>
                        {entry.tasks && <Badge variant="outline" className="mt-1 text-[10px]">{entry.tasks.title}</Badge>}
                      </TableCell>
                      <TableCell className="w-[100px] font-mono text-right">
                        {Number(entry.hours).toFixed(2)}
                      </TableCell>
                      <TableCell className="w-[100px] text-center">
                        {entry.billable ? <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Billable</Badge> : <Badge variant="outline">Non-billable</Badge>}
                      </TableCell>
                      <TableCell className="w-[140px]">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={entry.profiles?.avatar_url} />
                            <AvatarFallback className="text-[10px]">{entry.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-zinc-500 truncate">{entry.profiles?.full_name?.split(' ')[0]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[100px] text-right">
                        {(isAdmin || entry.logged_by === currentUserId) && (
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => handleDelete(entry.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        })}
        
        {sortedDates.length === 0 && (
          <div className="text-center py-12 text-zinc-500 border rounded-xl border-dashed">
            No time entries found.
          </div>
        )}
      </div>
    </div>
  );
}
