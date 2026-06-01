"use client";

import { useState, useEffect } from "react";
import { format, isBefore, isAfter, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Plus, Download, Edit, Trash, Bell, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart
} from "recharts";

import { Client, Invoice, Expense } from "@/types";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SendInvoiceButton from "@/components/SendInvoiceButton";
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
import { Switch } from "@/components/ui/switch";

type InvoiceWithClient = Invoice & { clients: { company_name: string, contact_email?: string } | null };

interface FinanceClientProps {
  clients: Client[];
  initialInvoices: InvoiceWithClient[];
  initialExpenses: Expense[];
  currentUserId: string;
}

export function FinanceClient({ clients, initialInvoices, initialExpenses, currentUserId }: FinanceClientProps) {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>(initialInvoices);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  // Modals state
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // Forms state
  const [invoiceForm, setInvoiceForm] = useState<Partial<Invoice>>({
    type: 'deposit',
    currency: 'USD',
    status: 'draft',
    issued_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    line_items: [{ description: '', amount: 0 }]
  });

  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    category: 'tools',
    currency: 'USD',
    date: format(new Date(), 'yyyy-MM-dd'),
    recurring: false,
    recurrence: null
  });

  // Auto-overdue effect
  useEffect(() => {
    const checkOverdue = async () => {
      const overdueToUpdate = invoices.filter(inv => 
        inv.status === 'sent' && 
        inv.due_date && 
        isBefore(parseISO(inv.due_date), new Date())
      );

      if (overdueToUpdate.length > 0) {
        for (const inv of overdueToUpdate) {
          await supabase.from('invoices').update({ status: 'overdue' }).eq('id', inv.id);
        }
        setInvoices(invoices.map(inv => 
          overdueToUpdate.find(o => o.id === inv.id) ? { ...inv, status: 'overdue' } : inv
        ));
      }
    };
    checkOverdue();
  }, [invoices, supabase]);

  // Metrics calculations
  const activeRetainers = clients.filter(c => c.retainer_active);
  const totalMRR = activeRetainers.reduce((sum, c) => sum + (c.retainer_amount || 0), 0);

  const thisMonthInvoices = invoices.filter(inv => 
    inv.status === 'paid' && 
    inv.paid_date && 
    isAfter(parseISO(inv.paid_date), startOfMonth(new Date())) &&
    isBefore(parseISO(inv.paid_date), endOfMonth(new Date()))
  );
  const thisMonthRevenue = thisMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const lastMonthInvoices = invoices.filter(inv => 
    inv.status === 'paid' && 
    inv.paid_date && 
    isAfter(parseISO(inv.paid_date), startOfMonth(subMonths(new Date(), 1))) &&
    isBefore(parseISO(inv.paid_date), endOfMonth(subMonths(new Date(), 1)))
  );
  const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const revenueTrend = thisMonthRevenue >= lastMonthRevenue;

  const thisMonthExpensesList = expenses.filter(exp => 
    isAfter(parseISO(exp.date), startOfMonth(new Date())) &&
    isBefore(parseISO(exp.date), endOfMonth(new Date()))
  );
  const thisMonthExpenses = thisMonthExpensesList.reduce((sum, exp) => sum + exp.amount, 0);

  const netProfit = thisMonthRevenue - thisMonthExpenses;

  const outstandingInvoices = invoices.filter(inv => ['sent', 'overdue'].includes(inv.status));
  const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueCount = outstandingInvoices.filter(inv => inv.status === 'overdue').length;

  const pipelineClients = clients.filter(c => ['proposal', 'signed', 'build'].includes(c.pipeline_stage));
  const pipelineValue = pipelineClients.reduce((sum, c) => sum + (c.pipeline_value || 0), 0);

  const formatUSD = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Chart Data Preparation
  const chartData = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(new Date(), 11 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);

    const monthRev = invoices
      .filter(inv => inv.status === 'paid' && inv.paid_date && isAfter(parseISO(inv.paid_date), start) && isBefore(parseISO(inv.paid_date), end))
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const monthExp = expenses
      .filter(exp => isAfter(parseISO(exp.date), start) && isBefore(parseISO(exp.date), end))
      .reduce((sum, exp) => sum + exp.amount, 0);

    return {
      month: format(d, 'MMM yy'),
      Revenue: monthRev,
      Expenses: monthExp,
      Profit: monthRev - monthExp
    };
  });

  // Handlers
  const handleSaveInvoice = async () => {
    if (!invoiceForm.client_id || !invoiceForm.amount) {
      toast.error("Client and amount are required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          ...invoiceForm,
          created_by: currentUserId
        }])
        .select('*, clients(company_name, contact_email)')
        .single();

      if (error) throw error;

      setInvoices([data as InvoiceWithClient, ...invoices]);
      setIsInvoiceOpen(false);
      setInvoiceForm({ type: 'deposit', currency: 'USD', status: 'draft', line_items: [{ description: '', amount: 0 }] });
      toast.success("Invoice created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    }
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.date) {
      toast.error("Description, amount, and date are required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          ...expenseForm,
          logged_by: currentUserId
        }])
        .select()
        .single();

      if (error) throw error;

      setExpenses([data as Expense, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setIsExpenseOpen(false);
      setExpenseForm({ category: 'tools', currency: 'USD', date: format(new Date(), 'yyyy-MM-dd'), recurring: false, recurrence: null });
      toast.success("Expense logged successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to log expense");
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, newStatus: string, client_id?: string | null) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'paid') updates.paid_date = new Date().toISOString();

      const { error } = await supabase.from('invoices').update(updates).eq('id', id);
      if (error) throw error;

      if (newStatus === 'paid' && client_id) {
        await supabase.from('activities').insert([{
          client_id,
          created_by: currentUserId,
          type: 'payment_received',
          title: 'Invoice Paid',
          content: 'Payment received for invoice',
          timestamp: new Date().toISOString()
        }]);
      }

      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
      toast.success(`Invoice marked as ${newStatus}`);
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const handleSendReminder = (invoice: InvoiceWithClient) => {
    const text = `Hi ${invoice.clients?.company_name || 'there'},\n\nJust a quick reminder that invoice ${invoice.invoice_ref} for ${formatUSD(invoice.amount)} was due on ${invoice.due_date}. Please let us know if you have any questions.\n\nBest,\nHisako Ops`;
    navigator.clipboard.writeText(text);
    toast.success("Reminder text copied to clipboard");
  };

  const [invoiceTab, setInvoiceTab] = useState("all");
  const filteredInvoices = invoices.filter(inv => {
    if (invoiceTab === "all") return true;
    if (invoiceTab === "outstanding") return ['sent', 'overdue'].includes(inv.status);
    return inv.status === invoiceTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsExpenseOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Log Expense
          </Button>
          <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90" onClick={() => setIsInvoiceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="mrr">MRR Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-medium text-zinc-500">MRR</div>
              <div className="mt-1 text-2xl font-bold">{formatUSD(totalMRR)}</div>
              <div className="mt-1 text-xs text-zinc-500">{activeRetainers.length} active retainers</div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-medium text-zinc-500">This Month Revenue</div>
              <div className="mt-1 text-2xl font-bold flex items-center gap-2">
                {formatUSD(thisMonthRevenue)}
                {revenueTrend ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-medium text-zinc-500">This Month Expenses</div>
              <div className="mt-1 text-2xl font-bold">{formatUSD(thisMonthExpenses)}</div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-medium text-zinc-500">Net Profit</div>
              <div className={`mt-1 text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatUSD(netProfit)}
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-medium text-zinc-500">Outstanding</div>
              <div className="mt-1 text-2xl font-bold">{formatUSD(outstandingAmount)}</div>
              {overdueCount > 0 && <div className="mt-1 text-xs text-red-500 font-medium">{overdueCount} overdue</div>}
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-medium text-zinc-500">Pipeline Value</div>
              <div className="mt-1 text-2xl font-bold">{formatUSD(pipelineValue)}</div>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 h-[400px]">
            <h2 className="text-lg font-semibold mb-4">Revenue vs Expenses (Last 12 Months)</h2>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip formatter={(v: any) => formatUSD(Number(v) || 0)} />
                <Legend />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Profit" stroke="#E8400C" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Tabs value={invoiceTab} onValueChange={setInvoiceTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="rounded-md border bg-white dark:bg-zinc-950 dark:border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Ref</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center h-32">No invoices found</TableCell></TableRow>
                ) : (
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_ref || 'Draft'}</TableCell>
                      <TableCell>{inv.clients?.company_name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{inv.type}</Badge></TableCell>
                      <TableCell>{formatUSD(inv.amount)}</TableCell>
                      <TableCell>{inv.issued_date ? format(parseISO(inv.issued_date), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell>{inv.due_date ? format(parseISO(inv.due_date), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          inv.status === 'overdue' ? 'bg-red-50 text-red-600 border-red-200' :
                          inv.status === 'sent' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-zinc-100 text-zinc-600'
                        }>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {['draft', 'sent', 'overdue'].includes(inv.status) && (
                            <SendInvoiceButton 
                              invoiceId={inv.id} 
                              clientEmail={inv.clients?.contact_email || ''} 
                              invoiceRef={inv.invoice_ref || 'Draft'} 
                              dueDate={inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : undefined}
                              clientName={inv.clients?.company_name || 'Client'}
                              amount={formatUSD(inv.amount)} 
                              onSuccess={() => {
                                if (inv.status === 'draft') handleUpdateInvoiceStatus(inv.id, 'sent');
                              }}
                            />
                          )}
                          {(inv.status === 'sent' || inv.status === 'overdue') && <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => handleUpdateInvoiceStatus(inv.id, 'paid', inv.client_id)}>Mark Paid</Button>}
                          {inv.status === 'overdue' && <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleSendReminder(inv)}><Bell className="h-4 w-4" /></Button>}
                          <a href={`/api/invoices/download?id=${inv.id}&format=pdf`} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="ghost" type="button">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="rounded-md border bg-white dark:bg-zinc-950 dark:border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Recurring</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-32">No expenses found</TableCell></TableRow>
                ) : (
                  expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>{format(parseISO(exp.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{exp.category}</Badge></TableCell>
                      <TableCell>{exp.vendor || '-'}</TableCell>
                      <TableCell>{exp.description}</TableCell>
                      <TableCell>{formatUSD(exp.amount)}</TableCell>
                      <TableCell>{exp.recurring ? <Badge>Yes ({exp.recurrence})</Badge> : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="mrr" className="space-y-4">
          <div className="rounded-md border bg-white dark:bg-zinc-950 dark:border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Monthly Amount</TableHead>
                  <TableHead>Since</TableHead>
                  <TableHead>Total Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRetainers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-32">No active retainers</TableCell></TableRow>
                ) : (
                  activeRetainers.map((c) => {
                    const invoicesForClient = invoices.filter(inv => inv.client_id === c.id && inv.status === 'paid' && inv.type === 'retainer');
                    const totalRec = invoicesForClient.reduce((sum, inv) => sum + inv.amount, 0);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.company_name}</TableCell>
                        <TableCell>{formatUSD(c.retainer_amount || 0)}</TableCell>
                        <TableCell>{format(parseISO(c.created_at), 'MMM yyyy')}</TableCell>
                        <TableCell>{formatUSD(totalRec)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
                {activeRetainers.length > 0 && (
                  <TableRow className="bg-zinc-50 dark:bg-zinc-900 font-bold">
                    <TableCell>Total MRR</TableCell>
                    <TableCell colSpan={3}>{formatUSD(totalMRR)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Invoice Modal */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Draft a new invoice for a client.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Client *</Label>
              <Select value={invoiceForm.client_id || ''} onValueChange={v => setInvoiceForm({...invoiceForm, client_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={invoiceForm.type} onValueChange={v => setInvoiceForm({...invoiceForm, type: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="retainer">Retainer</SelectItem>
                    <SelectItem value="adhoc">Ad-hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Total Amount ($) *</Label>
                <Input type="number" value={invoiceForm.amount || ''} onChange={e => setInvoiceForm({...invoiceForm, amount: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Issued Date</Label>
                <Input type="date" value={invoiceForm.issued_date || ''} onChange={e => setInvoiceForm({...invoiceForm, issued_date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input type="date" value={invoiceForm.due_date || ''} onChange={e => setInvoiceForm({...invoiceForm, due_date: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input value={invoiceForm.description || ''} onChange={e => setInvoiceForm({...invoiceForm, description: e.target.value})} placeholder="For services rendered..." />
            </div>
            
            <div className="grid gap-2">
              <Label>Line Items</Label>
              {invoiceForm.line_items?.map((item: any, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input 
                    placeholder="Description" 
                    value={item.description} 
                    onChange={e => {
                      const newItems = [...(invoiceForm.line_items || [])];
                      newItems[i].description = e.target.value;
                      setInvoiceForm({...invoiceForm, line_items: newItems});
                    }} 
                  />
                  <Input 
                    type="number" 
                    placeholder="Amount" 
                    className="w-32"
                    value={item.amount || ''} 
                    onChange={e => {
                      const newItems = [...(invoiceForm.line_items || [])];
                      newItems[i].amount = parseFloat(e.target.value) || 0;
                      setInvoiceForm({...invoiceForm, line_items: newItems});
                    }} 
                  />
                  <Button variant="ghost" size="icon" onClick={() => {
                     const newItems = invoiceForm.line_items?.filter((_, idx) => idx !== i);
                     setInvoiceForm({...invoiceForm, line_items: newItems});
                  }}>
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setInvoiceForm({...invoiceForm, line_items: [...(invoiceForm.line_items || []), {description: '', amount: 0}]})}>
                <Plus className="h-4 w-4 mr-2" /> Add Line Item
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceOpen(false)}>Cancel</Button>
            <Button className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90" onClick={handleSaveInvoice}>Save Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Expense Modal */}
      <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Expense</DialogTitle>
            <DialogDescription>Record a new company expense.</DialogDescription>
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
              <Input value={expenseForm.description || ''} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="Figma subscription..." />
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
            {expenseForm.recurring && (
              <div className="grid gap-2">
                <Label>Recurrence</Label>
                <Select value={expenseForm.recurrence || 'monthly'} onValueChange={v => setExpenseForm({...expenseForm, recurrence: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
