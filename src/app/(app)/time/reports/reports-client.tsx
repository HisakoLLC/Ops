"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function ReportsClient({ entries }: { entries: any[] }) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const filteredEntries = entries.filter(e => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const date = parseISO(e.date);
      // Ensure end date includes the full day
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    } catch {
      return true;
    }
  });

  // Calculate By Client
  const byClient = filteredEntries.reduce((acc: any, e: any) => {
    const cId = e.client_id;
    if (!acc[cId]) {
      acc[cId] = {
        name: e.clients?.company_name || "Unknown",
        totalHrs: 0,
        billableHrs: 0,
        revenue: Number(e.clients?.pipeline_value) || 0,
        cost: 0
      };
    }
    acc[cId].totalHrs += Number(e.hours);
    if (e.billable) acc[cId].billableHrs += Number(e.hours);
    acc[cId].cost += Number(e.hours) * Number(e.profiles?.hourly_cost || 0);
    return acc;
  }, {});

  const clientRows = Object.values(byClient).map((c: any) => {
    const profit = c.revenue - c.cost;
    const margin = c.revenue > 0 ? (profit / c.revenue) * 100 : 0;
    return { ...c, profit, margin };
  }).sort((a: any, b: any) => b.totalHrs - a.totalHrs);

  // Calculate By Team Member
  const byMember = filteredEntries.reduce((acc: any, e: any) => {
    const mId = e.logged_by;
    if (!acc[mId]) {
      acc[mId] = {
        name: e.profiles?.full_name || "Unknown",
        totalHrs: 0,
        billableHrs: 0,
        cost: 0
      };
    }
    acc[mId].totalHrs += Number(e.hours);
    if (e.billable) acc[mId].billableHrs += Number(e.hours);
    acc[mId].cost += Number(e.hours) * Number(e.profiles?.hourly_cost || 0);
    return acc;
  }, {});

  const memberRows = Object.values(byMember).map((m: any) => {
    const billablePct = m.totalHrs > 0 ? (m.billableHrs / m.totalHrs) * 100 : 0;
    return { ...m, billablePct };
  }).sort((a: any, b: any) => b.totalHrs - a.totalHrs);

  const formatUSD = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/time">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Time & Profitability Reports</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[140px]" />
            <span className="text-zinc-500">to</span>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[140px]" />
          </div>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> CSV</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By Client</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
                <TableHead className="text-right">Billable</TableHead>
                <TableHead className="text-right">Revenue (Fee)</TableHead>
                <TableHead className="text-right">Resource Cost</TableHead>
                <TableHead className="text-right">Gross Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientRows.map((c: any) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right">{c.totalHrs.toFixed(1)} hrs</TableCell>
                  <TableCell className="text-right">{c.billableHrs.toFixed(1)} hrs</TableCell>
                  <TableCell className="text-right">{c.revenue > 0 ? formatUSD(c.revenue) : '-'}</TableCell>
                  <TableCell className="text-right text-red-600">{formatUSD(c.cost)}</TableCell>
                  <TableCell className={`text-right font-medium ${c.profit > 0 ? 'text-emerald-600' : c.profit < 0 ? 'text-red-600' : ''}`}>
                    {c.revenue > 0 ? formatUSD(c.profit) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.revenue > 0 ? (
                      <Badge variant={c.margin > 50 ? "default" : c.margin > 20 ? "secondary" : "destructive"}>
                        {c.margin.toFixed(0)}%
                      </Badge>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {clientRows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-6 text-zinc-500">No time logged in this period.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Hours Logged</TableHead>
                <TableHead className="text-right">Billable %</TableHead>
                <TableHead className="text-right">Resource Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberRows.map((m: any) => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-right">{m.totalHrs.toFixed(1)} hrs</TableCell>
                  <TableCell className="text-right">{m.billablePct.toFixed(0)}%</TableCell>
                  <TableCell className="text-right text-red-600">{formatUSD(m.cost)}</TableCell>
                </TableRow>
              ))}
              {memberRows.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-zinc-500">No time logged in this period.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
