"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Search, Plus } from "lucide-react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { createClient } from "@/lib/supabase/client";
import { PIPELINE_STAGES } from "@/lib/constants";
import { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type KanbanClient = Client & { lastActivity?: string | null; daysInStage?: number };

const ACTIVE_STAGES = PIPELINE_STAGES.filter(s => !['inactive', 'churned'].includes(s.value));

export function PipelineBoardClient({ initialClients }: { initialClients: KanbanClient[] }) {
  const router = useRouter();
  const [clients, setClients] = useState<KanbanClient[]>(initialClients);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const pendingStageUpdateRef = useRef<{ clientId: string; stage: string } | null>(null);
  
  const supabase = createClient();

  const filteredClients = clients.filter(c => 
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = filteredClients.reduce((acc, c) => acc + (Number(c.pipeline_value) || 0), 0);

  const formatUSD = (val: number | null) => {
    if (!val) return "";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    pendingStageUpdateRef.current = null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveClient = active.data.current?.type === "Client";
    const isOverClient = over.data.current?.type === "Client";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveClient) return;

    setClients((clients) => {
      const activeIndex = clients.findIndex((c) => c.id === activeId);
      const overIndex = clients.findIndex((c) => c.id === overId);

      if (activeIndex === -1) return clients;

      let resultClients = clients;

      if (isOverClient) {
        const activeClient = clients[activeIndex];
        const overClient = clients[overIndex];

        if (activeClient.pipeline_stage !== overClient.pipeline_stage) {
          const newClients = clients.map((c, idx) => 
            idx === activeIndex 
              ? { ...c, pipeline_stage: overClient.pipeline_stage } 
              : c
          );
          resultClients = arrayMove(newClients, activeIndex, overIndex);
        } else {
          resultClients = arrayMove(clients, activeIndex, overIndex);
        }
      } else if (isOverColumn) {
        const newClients = clients.map((c, idx) => 
          idx === activeIndex 
            ? { ...c, pipeline_stage: overId as any } 
            : c
        );
        resultClients = arrayMove(newClients, activeIndex, newClients.length - 1);
      }

      const updatedActiveClient = resultClients.find(c => c.id === activeId);
      if (updatedActiveClient) {
        pendingStageUpdateRef.current = {
          clientId: activeId as string,
          stage: updatedActiveClient.pipeline_stage
        };
      }

      return resultClients;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active } = event;
    const activeId = active.id as string;
    const originalClient = initialClients.find(c => c.id === activeId);
    if (!originalClient) return;

    const pendingUpdate = pendingStageUpdateRef.current;
    const newStage = pendingUpdate && pendingUpdate.clientId === activeId
      ? pendingUpdate.stage
      : originalClient.pipeline_stage;

    pendingStageUpdateRef.current = null;

    if (originalClient.pipeline_stage !== newStage) {
      const oldStage = originalClient.pipeline_stage;

      const { data: userData } = await supabase.auth.getUser();

      // Update Supabase
      const { error } = await supabase
        .from("clients")
        .update({ pipeline_stage: newStage })
        .eq("id", activeId);

      if (error) {
        toast.error("Failed to update stage");
        // Revert local state if DB update fails
        setClients(clients => clients.map(c => c.id === activeId ? { ...c, pipeline_stage: oldStage } : c));
        return;
      }

      // Insert Activity
      await supabase
        .from("activities")
        .insert([{
          client_id: activeId,
          created_by: userData.user?.id,
          type: "stage_change",
          title: "Stage changed",
          metadata: { from_stage: oldStage, to_stage: newStage },
        }]);

      toast.success("Pipeline stage updated");
      
      // Update original client in our pseudo-cache
      originalClient.pipeline_stage = newStage as any;
      router.refresh();
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }),
  };

  const activeClient = clients.find(c => c.id === activeId);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Filters & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search company..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Total Pipeline</span>
            <span className="text-lg font-bold">{formatUSD(totalValue)}</span>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-h-[500px]">
            {ACTIVE_STAGES.map((stage) => {
              const columnClients = filteredClients.filter(c => c.pipeline_stage === stage.value);
              const columnValue = columnClients.reduce((acc, c) => acc + (Number(c.pipeline_value) || 0), 0);
              
              return (
                <BoardColumn 
                  key={stage.value} 
                  stage={stage} 
                  clients={columnClients} 
                  columnValue={columnValue} 
                  formatUSD={formatUSD} 
                />
              );
            })}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeClient ? (
              <ClientCard client={activeClient} formatUSD={formatUSD} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function BoardColumn({ stage, clients, columnValue, formatUSD }: any) {
  const { setNodeRef } = useSortable({
    id: stage.value,
    data: { type: "Column", stage },
  });

  return (
    <div className="flex flex-col w-[280px] shrink-0 h-full bg-zinc-100/50 dark:bg-zinc-900/20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
            <h3 className="font-semibold text-sm">{stage.label}</h3>
            <Badge variant="secondary" className="px-1.5 py-0 text-xs">{clients.length}</Badge>
          </div>
          <Link href={`/clients/new?stage=${stage.value}`}>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        {columnValue > 0 && (
          <div className="text-xs text-zinc-500 font-medium">
            {formatUSD(columnValue)}
          </div>
        )}
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext items={clients.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
          {clients.map((client: any) => (
            <SortableClientCard key={client.id} client={client} formatUSD={formatUSD} />
          ))}
        </SortableContext>
        {/* Empty placeholder to ensure column is droppable even when empty */}
        {clients.length === 0 && (
          <div className="h-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center text-xs text-zinc-400">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

function SortableClientCard({ client, formatUSD }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: client.id,
    data: { type: "Client", client },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ClientCard client={client} formatUSD={formatUSD} isDragging={isDragging} />
    </div>
  );
}

function ClientCard({ client, formatUSD, isOverlay, isDragging }: any) {
  const tags = client.tags?.slice(0, 2) || [];

  return (
    <div className={`bg-white dark:bg-zinc-950 p-3 rounded-lg border shadow-sm group ${
      isOverlay ? 'shadow-xl scale-105 border-[#E8400C]/50' : 'border-zinc-200 dark:border-zinc-800'
    } ${isDragging ? 'border-dashed' : ''} cursor-grab active:cursor-grabbing`}>
      <div className="flex justify-between items-start mb-2">
        <Link 
          href={`/clients/${client.id}`}
          className="font-semibold text-sm hover:text-[#E8400C] transition-colors line-clamp-1"
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking link
        >
          {client.company_name}
        </Link>
      </div>
      
      <div className="text-xs text-zinc-500 mb-3">
        {client.contact_name || "No contact"}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-xs font-medium">
          {formatUSD(client.pipeline_value)}
        </div>
        <div className="text-[10px] text-zinc-400">
          {client.daysInStage !== undefined ? `${client.daysInStage}d in stage` : ''}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          {tags.map((tag: string) => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {tag}
            </span>
          ))}
          {client.tags?.length > 2 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              +{client.tags.length - 2}
            </span>
          )}
        </div>
        {client.lastActivity && (
          <div className="text-[9px] text-zinc-400">
            {formatDistanceToNow(new Date(client.lastActivity))} ago
          </div>
        )}
      </div>
    </div>
  );
}
