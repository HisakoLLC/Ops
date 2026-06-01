"use client";

import { useState } from "react";
import { Vendor, Client } from "@/types";
import { format, parseISO, differenceInDays } from "date-fns";
import { Plus, ExternalLink, Copy, Search, AlertCircle, PlaySquare, Settings, DollarSign, Edit, Database, Cloud, MessageSquare, Briefcase, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const formatUSD = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export function VendorsClient({ initialVendors, clients }: { initialVendors: any[], clients: any[] }) {
  const supabase = createClient();
  const [vendors, setVendors] = useState<any[]>(initialVendors);
  
  const [tab, setTab] = useState("hisako");
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  
  const [isExpenseModalOpen, setIsExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState<Partial<any>>({});

  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({
    active: true,
    is_client_tool: false,
  });

  const hisakoVendors = vendors.filter(v => !v.is_client_tool);
  const clientVendors = vendors.filter(v => v.is_client_tool);

  const totalMonthlySpend = hisakoVendors
    .filter(v => v.active && v.monthly_cost)
    .reduce((sum, v) => sum + Number(v.monthly_cost), 0);

  const expiringSoon = hisakoVendors.filter(v => {
    if (!v.renewal_date) return false;
    const days = differenceInDays(parseISO(v.renewal_date), new Date());
    return days >= 0 && days <= 14;
  });

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'automation': return <PlaySquare className="h-4 w-4" />;
      case 'ai_model': return <Bot className="h-4 w-4" />;
      case 'crm': return <Briefcase className="h-4 w-4" />;
      case 'email': return <MessageSquare className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'infrastructure': return <Cloud className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const handleSaveVendor = async () => {
    if (!vendorForm.name || !vendorForm.category) {
      toast.error("Name and Category are required");
      return;
    }
    
    try {
      if (editingVendor) {
        const { error } = await supabase.from('vendors').update(vendorForm).eq('id', editingVendor.id);
        if (error) throw error;
        toast.success("Vendor updated");
        setVendors(vendors.map(v => v.id === editingVendor.id ? { ...v, ...vendorForm } : v));
      } else {
        const { data, error } = await supabase.from('vendors').insert([vendorForm]).select('*, clients(company_name, contact_email)').single();
        if (error) throw error;
        toast.success("Vendor added");
        setVendors([data, ...vendors]);
      }
      setIsVendorModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openExpenseModal = (vendor: any) => {
    setExpenseForm({
      category: 'tools',
      vendor: vendor.name,
      amount: vendor.monthly_cost || 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      description: `${vendor.name} Subscription`,
      recurring: true,
      recurrence: 'monthly'
    });
    setIsExpenseOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.category || !expenseForm.date || !expenseForm.amount || !expenseForm.description) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const { error } = await supabase.from('expenses').insert([{ ...expenseForm }]);
      if (error) throw error;
      toast.success("Expense logged successfully");
      setIsExpenseOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const seedData = async () => {
    const seed = [
      { name: 'n8n', category: 'automation', login_url: 'https://n8n.cloud', monthly_cost: 20, billing_cycle: 'monthly' },
      { name: 'Make', category: 'automation', login_url: 'https://eu1.make.com/login', monthly_cost: 10, billing_cycle: 'monthly' },
      { name: 'OpenAI API', category: 'ai_model', login_url: 'https://platform.openai.com', billing_cycle: 'usage' },
      { name: 'Anthropic API', category: 'ai_model', login_url: 'https://console.anthropic.com', billing_cycle: 'usage' },
      { name: 'Google AI', category: 'ai_model', login_url: 'https://aistudio.google.com', billing_cycle: 'free' },
      { name: 'Vercel', category: 'infrastructure', login_url: 'https://vercel.com/login', monthly_cost: 20, billing_cycle: 'monthly' },
      { name: 'Supabase', category: 'database', login_url: 'https://supabase.com/dashboard', monthly_cost: 25, billing_cycle: 'monthly' },
      { name: 'GitHub', category: 'infrastructure', login_url: 'https://github.com', billing_cycle: 'free' },
    ];
    try {
      const { data, error } = await supabase.from('vendors').insert(seed.map(s => ({ ...s, active: true, is_client_tool: false }))).select('*, clients(company_name, contact_email)');
      if (error) throw error;
      setVendors([...(data || []), ...vendors]);
      toast.success("Seed data added");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Vendor Registry</h1>
        <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90" onClick={() => {
          setEditingVendor(null);
          setVendorForm({ active: true, is_client_tool: tab === 'client' });
          setIsVendorModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Vendor
        </Button>
      </div>

      <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md border border-yellow-200 text-sm flex items-center">
        <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
        <span className="font-medium">Credentials are not stored here. Use your team password manager for passwords.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-medium text-zinc-500">Total Monthly Spend</div>
          <div className="mt-1 text-2xl font-bold">{formatUSD(totalMonthlySpend)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-medium text-zinc-500">Tools Expiring Soon</div>
          <div className="mt-1 text-2xl font-bold text-yellow-600">{expiringSoon.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-medium text-zinc-500">Client Tools Managed</div>
          <div className="mt-1 text-2xl font-bold">{clientVendors.length}</div>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md border border-red-200 text-sm">
          <div className="flex items-center font-bold mb-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            Tools Expiring Within 14 Days
          </div>
          <ul className="list-disc pl-5">
            {expiringSoon.map(v => (
              <li key={v.id}>{v.name} renews on {format(parseISO(v.renewal_date), 'MMM d, yyyy')} ({differenceInDays(parseISO(v.renewal_date), new Date())} days)</li>
            ))}
          </ul>
        </div>
      )}

      {vendors.length === 0 && (
        <div className="text-center p-8 bg-zinc-50 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">No tools tracked yet</h2>
          <p className="text-zinc-500 mb-4">Start by adding your common automation and AI tools.</p>
          <Button onClick={seedData} variant="outline">Seed Common Tools</Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="hisako">Hisako Tools</TabsTrigger>
          <TabsTrigger value="client">Client Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="hisako" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hisakoVendors.map(v => (
              <Card key={v.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2 text-zinc-500">
                      {getCategoryIcon(v.category)}
                      <span className="text-xs uppercase tracking-wider">{v.category.replace('_', ' ')}</span>
                    </div>
                    <Badge variant={v.active ? 'default' : 'secondary'} className={v.active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""}>
                      {v.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mt-2">{v.name}</CardTitle>
                  {v.website && (
                    <a href={v.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center mt-1">
                      {v.website} <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </CardHeader>
                <CardContent className="flex-1 pb-2 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-zinc-50 p-2 rounded border">
                      <div className="text-xs text-zinc-500 mb-1">Cost</div>
                      <div className="font-medium">{v.monthly_cost ? formatUSD(v.monthly_cost) : '-'} <span className="text-xs text-zinc-400 capitalize">{v.billing_cycle === 'monthly' ? '/mo' : v.billing_cycle === 'annual' ? '/yr' : v.billing_cycle || ''}</span></div>
                    </div>
                    <div className="bg-zinc-50 p-2 rounded border">
                      <div className="text-xs text-zinc-500 mb-1">Renewal</div>
                      <div className="font-medium">
                        {v.renewal_date ? (
                          <span className={
                            differenceInDays(parseISO(v.renewal_date), new Date()) < 14 ? 'text-red-600' :
                            differenceInDays(parseISO(v.renewal_date), new Date()) < 30 ? 'text-yellow-600' :
                            'text-emerald-600'
                          }>
                            {format(parseISO(v.renewal_date), 'MMM d, yyyy')}
                          </span>
                        ) : '-'}
                      </div>
                    </div>
                  </div>
                  
                  {(v.login_email || v.login_url) && (
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      {v.login_email && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500 truncate">{v.login_email}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                            navigator.clipboard.writeText(v.login_email);
                            toast.success("Email copied");
                          }}><Copy className="h-3 w-3" /></Button>
                        </div>
                      )}
                      {v.login_url && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500 truncate max-w-[200px]">{v.login_url}</span>
                          <a href={v.login_url} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><ExternalLink className="h-3 w-3" /></Button>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 border-t mt-auto flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingVendor(v); setVendorForm(v); setIsVendorModalOpen(true); }}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  {v.monthly_cost && (
                    <Button variant="outline" size="sm" onClick={() => openExpenseModal(v)}>
                      <DollarSign className="h-4 w-4 mr-2" /> Add to Exp
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="client" className="space-y-4">
          <div className="rounded-md border bg-white dark:bg-zinc-950">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Monthly Cost</TableHead>
                  <TableHead>Login Info</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientVendors.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.clients?.company_name || '-'}</TableCell>
                    <TableCell className="capitalize">{v.category.replace('_', ' ')}</TableCell>
                    <TableCell>{v.monthly_cost ? formatUSD(v.monthly_cost) : '-'}</TableCell>
                    <TableCell>
                      {v.login_email && <div className="text-xs">{v.login_email}</div>}
                      {v.login_url && <a href={v.login_url} target="_blank" className="text-xs text-blue-600 hover:underline">Login URL</a>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingVendor(v); setVendorForm(v); setIsVendorModalOpen(true); }}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {clientVendors.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center h-32">No client tools tracked.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Vendor Modal */}
      <Dialog open={isVendorModalOpen} onOpenChange={setIsVendorModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
            <DialogDescription>Track a new tool or subscription.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch checked={vendorForm.is_client_tool || false} onCheckedChange={v => setVendorForm({...vendorForm, is_client_tool: v})} />
              <Label>This is a Client Tool</Label>
            </div>
            
            {vendorForm.is_client_tool && (
              <div className="grid gap-2">
                <Label>Client *</Label>
                <Select value={vendorForm.client_id || ''} onValueChange={v => setVendorForm({...vendorForm, client_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Client">{clients.find(c => c.id === vendorForm.client_id)?.company_name}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Vendor Name *</Label>
                <Input value={vendorForm.name || ''} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} placeholder="e.g. n8n" />
              </div>
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select value={vendorForm.category || ''} onValueChange={v => setVendorForm({...vendorForm, category: v as any})}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automation">Automation</SelectItem>
                    <SelectItem value="ai_model">AI Model</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Monthly Cost ($)</Label>
                <Input type="number" value={vendorForm.monthly_cost || ''} onChange={e => setVendorForm({...vendorForm, monthly_cost: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="grid gap-2">
                <Label>Billing Cycle</Label>
                <Select value={vendorForm.billing_cycle || ''} onValueChange={v => setVendorForm({...vendorForm, billing_cycle: v as any})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="usage">Usage-based</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Renewal Date</Label>
              <Input type="date" value={vendorForm.renewal_date || ''} onChange={e => setVendorForm({...vendorForm, renewal_date: e.target.value})} />
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-4">Access Details</h4>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Website URL</Label>
                  <Input value={vendorForm.website || ''} onChange={e => setVendorForm({...vendorForm, website: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Login URL</Label>
                    <Input value={vendorForm.login_url || ''} onChange={e => setVendorForm({...vendorForm, login_url: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Login Email</Label>
                    <Input value={vendorForm.login_email || ''} onChange={e => setVendorForm({...vendorForm, login_email: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={vendorForm.notes || ''} onChange={e => setVendorForm({...vendorForm, notes: e.target.value})} />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch checked={vendorForm.active} onCheckedChange={v => setVendorForm({...vendorForm, active: v})} />
              <Label>Active Subscription</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVendorModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90" onClick={handleSaveVendor}>Save Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Expense Modal (Duplicated for Add to Expenses) */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Expense</DialogTitle>
            <DialogDescription>Add this tool to your monthly expenses.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select value={expenseForm.category} onValueChange={v => setExpenseForm({...expenseForm, category: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tools">Tools & Software</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="ops">Operations</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Date *</Label>
                <Input type="date" value={expenseForm.date || ''} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Input value={expenseForm.description || ''} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Amount ($) *</Label>
                <Input type="number" value={expenseForm.amount || ''} onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="grid gap-2">
                <Label>Vendor Name</Label>
                <Input value={expenseForm.vendor || ''} onChange={e => setExpenseForm({...expenseForm, vendor: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Switch checked={expenseForm.recurring || false} onCheckedChange={v => setExpenseForm({...expenseForm, recurring: v, recurrence: v ? 'monthly' : null})} />
              <Label>Recurring Expense</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpenseOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveExpense}>Log Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
