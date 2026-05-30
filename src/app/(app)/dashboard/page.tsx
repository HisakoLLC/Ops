import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_STAGES } from "@/lib/constants";
import Link from "next/link";
import { formatDistanceToNow, startOfMonth } from "date-fns";
import { StickyNote, Phone, Mail, Calendar, ArrowRight, FileText, DollarSign, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // TASK 1: Stats
  // 1. Total Clients (not churned)
  const { count: totalClients } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .neq("pipeline_stage", "churned");

  // 2. Pipeline Value
  const { data: pipelineClients } = await supabase
    .from("clients")
    .select("pipeline_value")
    .in("pipeline_stage", ["proposal", "signed", "build", "live"]);
  
  const pipelineValue = pipelineClients?.reduce((acc, c) => acc + (Number(c.pipeline_value) || 0), 0) || 0;

  // 3. Active Retainers
  const { data: retainerClients } = await supabase
    .from("clients")
    .select("retainer_amount")
    .eq("retainer_active", true);
  
  const activeRetainersCount = retainerClients?.length || 0;
  const retainerValue = retainerClients?.reduce((acc, c) => acc + (Number(c.retainer_amount) || 0), 0) || 0;

  // 4. Docs This Month
  const { count: docsThisMonth } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth(new Date()).toISOString());

  // TASK 2: Pipeline Funnel Bar
  const { data: allClientsForFunnel } = await supabase
    .from("clients")
    .select("pipeline_stage");
  
  const funnelCounts = PIPELINE_STAGES.map((stage) => {
    const count = allClientsForFunnel?.filter(c => c.pipeline_stage === stage.value).length || 0;
    return { ...stage, count };
  }).filter(s => s.value !== "churned" && s.value !== "inactive");

  const totalFunnel = funnelCounts.reduce((acc, s) => acc + s.count, 0) || 1; // avoid div by 0

  // TASK 3: Recent Activity
  const { data: recentActivities } = await supabase
    .from("activities")
    .select(`
      *,
      clients:client_id (id, company_name)
    `)
    .order("created_at", { ascending: false })
    .limit(15);

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

  // TASK 4: Needs Attention
  // Clients in discovery, proposal, signed, build, live
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: needsAttentionClients } = await supabase
    .from("clients")
    .select(`
      id,
      company_name,
      pipeline_stage,
      activities ( created_at )
    `)
    .in("pipeline_stage", ["discovery", "proposal", "signed", "build", "live"]);

  const needsAttention = needsAttentionClients?.map(client => {
    // Sort activities by date descending
    const sortedActivities = client.activities.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const lastActivityDate = sortedActivities.length > 0 ? new Date(sortedActivities[0].created_at) : null;
    
    return {
      ...client,
      lastActivityDate
    };
  }).filter(c => {
    if (!c.lastActivityDate) return true; // No activities ever
    return c.lastActivityDate < sevenDaysAgo;
  }).map(c => {
    const daysSince = c.lastActivityDate 
      ? Math.floor((new Date().getTime() - c.lastActivityDate.getTime()) / (1000 * 3600 * 24))
      : "No";
    return {
      ...c,
      daysSince
    };
  }).sort((a, b) => {
    if (a.daysSince === "No") return -1;
    if (b.daysSince === "No") return 1;
    return (b.daysSince as number) - (a.daysSince as number);
  });

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* TASK 1: Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(pipelineValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Retainers</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRetainersCount}</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {formatUSD(retainerValue)}/mo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Docs This Month</CardTitle>
            <FileText className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{docsThisMonth || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* TASK 2: Pipeline Funnel Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-12 w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            {funnelCounts.map((stage) => {
              const width = Math.max((stage.count / totalFunnel) * 100, 0);
              if (width === 0) return null;
              return (
                <Link
                  key={stage.value}
                  href={`/clients?stage=${stage.value}`}
                  className={`${stage.color} flex items-center justify-center text-xs font-semibold text-white transition-opacity hover:opacity-80`}
                  style={{ width: `${width}%` }}
                  title={`${stage.label}: ${stage.count}`}
                >
                  {stage.count > 0 && width > 5 && stage.count}
                </Link>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
            {funnelCounts.map((stage) => (
              <div key={stage.value} className="flex items-center gap-1.5">
                <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                <span className="text-zinc-600 dark:text-zinc-300">{stage.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* TASK 3: Recent Activity */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-6">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-sm">
                        <Link
                          href={`/clients/${activity.client_id}`}
                          className="font-medium hover:text-[#E8400C] dark:hover:text-[#E8400C] transition-colors"
                        >
                          {activity.clients?.company_name || "Unknown Client"}
                        </Link>
                        {" — "}
                        <span className="text-zinc-600 dark:text-zinc-300">{activity.title}</span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                No activity yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* TASK 4: Needs Attention */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            {needsAttention && needsAttention.length > 0 ? (
              <div className="space-y-4">
                {needsAttention.map((client) => {
                  const stageObj = PIPELINE_STAGES.find(s => s.value === client.pipeline_stage);
                  return (
                    <Link
                      key={client.id}
                      href={`/clients/${client.id}`}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{client.company_name}</div>
                        <div className="text-xs text-red-500 dark:text-red-400 font-medium">
                          {client.daysSince} days since last activity
                        </div>
                      </div>
                      <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${stageObj?.color}`}>
                        {stageObj?.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="text-green-500">✓</span>
                <span>All clients are up to date</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
