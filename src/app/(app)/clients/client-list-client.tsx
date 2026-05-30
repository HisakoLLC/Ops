"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Search, Plus, Filter, Users } from "lucide-react";

import { Client } from "@/types";
import { PIPELINE_STAGES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type ClientWithActivity = Client & { lastActivity?: string | null };

export function ClientListClient({ initialClients }: { initialClients: ClientWithActivity[] }) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("updated_desc");

  // Extract unique tags
  const allTags = Array.from(
    new Set(initialClients.flatMap((client) => client.tags || []))
  ).sort();

  // Filter clients
  const filteredClients = initialClients.filter((client) => {
    // Search
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      client.company_name.toLowerCase().includes(searchLower) ||
      (client.contact_name?.toLowerCase() || "").includes(searchLower) ||
      (client.contact_email?.toLowerCase() || "").includes(searchLower);

    // Stage
    const matchesStage = stageFilter === "all" || client.pipeline_stage === stageFilter;

    // Tags
    const matchesTag = !tagFilter || (client.tags || []).includes(tagFilter);

    return matchesSearch && matchesStage && matchesTag;
  });

  // Sort clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    switch (sortBy) {
      case "updated_desc":
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case "created_desc":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "name_asc":
        return a.company_name.localeCompare(b.company_name);
      case "value_desc":
        return (b.pipeline_value || 0) - (a.pipeline_value || 0);
      default:
        return 0;
    }
  });

  const formatUSD = (val: number | null) => {
    if (!val) return "-";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <Link href="/clients/new">
          <Button className="bg-[#E8400C] hover:bg-[#E8400C]/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search company or contact..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={stageFilter} onValueChange={(val) => setStageFilter(val || "all")}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="All Stages" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {PIPELINE_STAGES.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val) => setSortBy(val as "newest" | "value" | "name" | "updated")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">Last Updated</SelectItem>
              <SelectItem value="created_desc">Created Date</SelectItem>
              <SelectItem value="name_asc">Company Name</SelectItem>
              <SelectItem value="value_desc">Pipeline Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={tagFilter === tag ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
          {tagFilter && (
            <Badge
              variant="outline"
              className="cursor-pointer text-zinc-500 hover:text-zinc-900"
              onClick={() => setTagFilter(null)}
            >
              Clear filter
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border bg-white dark:bg-zinc-950 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-500">
                    <Users className="h-12 w-12 mb-4 text-zinc-300 dark:text-zinc-700" />
                    <p className="text-lg font-medium">No clients found</p>
                    <p className="text-sm">Add your first client or adjust your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedClients.map((client) => {
                const stageObj = PIPELINE_STAGES.find((s) => s.value === client.pipeline_stage);
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{client.company_name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{client.ref}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-zinc-900 dark:text-zinc-100">{client.contact_name || "-"}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{client.contact_email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${stageObj?.color} text-white border-transparent`}>
                        {stageObj?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatUSD(client.pipeline_value)}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {client.lastActivity 
                        ? formatDistanceToNow(new Date(client.lastActivity), { addSuffix: true })
                        : "Never"
                      }
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {format(new Date(client.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
