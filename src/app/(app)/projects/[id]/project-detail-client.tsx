"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Project, Task, Milestone } from "@/types";
import { CheckSquare, Circle, Plus, Trash, Settings, Calendar, Briefcase, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS = ['todo', 'in_progress', 'blocked', 'done'];

function SortableTask({ task, onClick, profiles }: { task: any, onClick: () => void, profiles: any[] }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const assignee = profiles.find(p => p.id === task.assigned_to);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick} className="bg-white dark:bg-zinc-900 border rounded-md p-3 mb-2 shadow-sm cursor-grab active:cursor-grabbing hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex justify-between items-start mb-2">
        <Badge variant="outline" className={`text-[10px] uppercase ${task.priority === 'urgent' ? 'text-red-600 bg-red-50' : task.priority === 'high' ? 'text-orange-600 bg-orange-50' : ''}`}>
          {task.priority}
        </Badge>
        {assignee && (
          <Avatar className="h-5 w-5">
            <AvatarImage src={assignee.avatar_url} />
            <AvatarFallback className="text-[10px]">{assignee.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className="text-sm font-medium leading-tight">{task.title}</div>
      {task.due_date && <div className="text-xs text-zinc-500 mt-2 flex items-center"><Calendar className="h-3 w-3 mr-1" /> {format(parseISO(task.due_date), 'MMM d')}</div>}
    </div>
  );
}

export function ProjectDetailClient({ initialProject, initialTasks, initialMilestones, teamProfiles }: { initialProject: any, initialTasks: any[], initialMilestones: any[], teamProfiles: any[] }) {
  const supabase = createClient();
  const [project, setProject] = useState(initialProject);
  const [tasks, setTasks] = useState(initialTasks);
  const [milestones, setMilestones] = useState(initialMilestones);
  
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', due_date: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'on_track': return "bg-emerald-100 text-emerald-800";
      case 'at_risk': return "bg-yellow-100 text-yellow-800";
      case 'delayed': return "bg-red-100 text-red-800";
      case 'complete': return "bg-zinc-100 text-zinc-800";
      default: return "";
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Check if dropped on a column directly
    if (COLUMNS.includes(overId)) {
      if (active.data.current?.status !== overId) {
         updateTaskStatus(activeId, overId);
      }
      return;
    }

    // Dropped on another task
    const activeTask = tasks.find(t => t.id === activeId);
    const overTask = tasks.find(t => t.id === overId);
    
    if (activeTask && overTask && activeTask.status !== overTask.status) {
      updateTaskStatus(activeId, overTask.status);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) toast.error("Failed to move task");
  };

  const handleTaskSave = async () => {
    if (!activeTask) return;
    setTasks(tasks.map(t => t.id === activeTask.id ? activeTask : t));
    const { error } = await supabase.from('tasks').update({
      title: activeTask.title,
      description: activeTask.description,
      assigned_to: activeTask.assigned_to,
      priority: activeTask.priority,
      status: activeTask.status,
      due_date: activeTask.due_date || null
    }).eq('id', activeTask.id);
    
    if (error) toast.error("Failed to update task");
    else toast.success("Task updated");
  };

  const createTask = async (status: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const newTask = {
      project_id: project.id,
      client_id: project.client_id,
      title: 'New Task',
      status,
      created_by: userData.user?.id
    };
    const { data, error } = await supabase.from('tasks').insert([newTask]).select().single();
    if (data) setTasks([data, ...tasks]);
  };

  const toggleMilestone = async (m: any) => {
    const newCompletedAt = m.completed_at ? null : new Date().toISOString();
    setMilestones(milestones.map(x => x.id === m.id ? { ...x, completed_at: newCompletedAt } : x));
    const { error } = await supabase.from('milestones').update({ completed_at: newCompletedAt }).eq('id', m.id);
    if (error) toast.error("Failed to update milestone");
  };

  const addMilestone = async () => {
    if (!newMilestone.name) return;
    const payload = { project_id: project.id, name: newMilestone.name, due_date: newMilestone.due_date || null };
    const { data, error } = await supabase.from('milestones').insert([payload]).select().single();
    if (data) setMilestones([...milestones, data].sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
    setIsMilestoneModalOpen(false);
    setNewMilestone({ name: '', due_date: '' });
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="secondary" className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="capitalize">{project.phase}</Badge>
          </div>
          <div className="text-zinc-500 mt-1 flex gap-4">
            <a href={`/clients/${project.client_id}`} className="hover:underline flex items-center"><Briefcase className="h-4 w-4 mr-1"/> {project.clients?.company_name}</a>
            <span className="flex items-center"><Calendar className="h-4 w-4 mr-1"/> {project.target_end_date ? format(parseISO(project.target_end_date), 'MMM d, yyyy') : 'No target date'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Settings className="h-4 w-4 mr-2"/> Settings</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6">
        {/* LEFT PANEL: Info & Milestones */}
        <div className="w-[35%] flex flex-col gap-6 overflow-y-auto pr-2">
          <div className="rounded-xl border bg-white p-5 dark:bg-zinc-950 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Project Description</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{project.description || 'No description provided.'}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 dark:bg-zinc-950 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Milestones</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsMilestoneModalOpen(true)}><Plus className="h-4 w-4"/></Button>
            </div>
            <div className="space-y-4">
              {milestones.length === 0 ? (
                <div className="text-sm text-zinc-500 text-center py-4">No milestones tracked</div>
              ) : (
                milestones.map((m: any) => (
                  <div key={m.id} className="flex items-start gap-3">
                    <Checkbox checked={!!m.completed_at} onCheckedChange={() => toggleMilestone(m)} className="mt-1" />
                    <div className={`flex flex-col ${m.completed_at ? 'opacity-50 line-through' : ''}`}>
                      <span className="text-sm font-medium">{m.name}</span>
                      {m.due_date && <span className="text-xs text-zinc-500">{format(parseISO(m.due_date), 'MMM d, yyyy')}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Kanban */}
        <div className="w-[65%] flex gap-4 overflow-x-auto pb-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col);
              return (
                <div key={col} className="bg-zinc-50 dark:bg-zinc-950/50 rounded-xl p-3 min-w-[280px] w-[280px] flex flex-col border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{col.replace('_', ' ')}</h4>
                    <span className="text-xs font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 rounded">{colTasks.length}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-zinc-500 mb-3 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400" onClick={() => createTask(col)}>
                    <Plus className="h-4 w-4 mr-2"/> Add Task
                  </Button>
                  <SortableContext id={col} items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex-1 overflow-y-auto min-h-[100px]">
                      {colTasks.map(t => (
                        <SortableTask key={t.id} task={t} profiles={teamProfiles} onClick={() => { setActiveTask(t); setIsTaskSheetOpen(true); }} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </DndContext>
        </div>
      </div>

      {/* Task Detail Sheet */}
      <Sheet open={isTaskSheetOpen} onOpenChange={setIsTaskSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {activeTask && (
            <div className="flex flex-col h-full">
              <SheetHeader className="mb-6">
                <SheetTitle>
                  <Input 
                    value={activeTask.title} 
                    onChange={e => setActiveTask({...activeTask, title: e.target.value})} 
                    className="text-lg font-bold border-transparent px-0 focus-visible:ring-0 focus-visible:border-zinc-300"
                  />
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto space-y-6 px-1">
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={activeTask.description || ''} 
                    onChange={e => setActiveTask({...activeTask, description: e.target.value})} 
                    placeholder="Add details..."
                    className="min-h-[120px]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={activeTask.status} onValueChange={v => setActiveTask({...activeTask, status: v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Todo</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select value={activeTask.priority} onValueChange={v => setActiveTask({...activeTask, priority: v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Assignee</Label>
                    <Select value={activeTask.assigned_to || 'unassigned'} onValueChange={v => setActiveTask({...activeTask, assigned_to: v === 'unassigned' ? null : v})}>
                      <SelectTrigger><SelectValue>{activeTask.assigned_to && activeTask.assigned_to !== 'unassigned' ? teamProfiles.find(p => p.id === activeTask.assigned_to)?.full_name : 'Unassigned'}</SelectValue></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamProfiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={activeTask.due_date || ''} onChange={e => setActiveTask({...activeTask, due_date: e.target.value})} />
                  </div>
                </div>
              </div>
              
              <div className="mt-auto pt-6 border-t flex justify-between">
                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                  await supabase.from('tasks').delete().eq('id', activeTask.id);
                  setTasks(tasks.filter(t => t.id !== activeTask.id));
                  setIsTaskSheetOpen(false);
                  toast.success("Task deleted");
                }}>
                  <Trash className="h-4 w-4 mr-2" /> Delete
                </Button>
                <Button onClick={handleTaskSave} className="bg-[#E8400C] text-white hover:bg-[#E8400C]/90">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isMilestoneModalOpen} onOpenChange={setIsMilestoneModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Milestone Name</Label>
              <Input value={newMilestone.name} onChange={e => setNewMilestone({...newMilestone, name: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input type="date" value={newMilestone.due_date} onChange={e => setNewMilestone({...newMilestone, due_date: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMilestoneModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#E8400C] text-white" onClick={addMilestone}>Add Milestone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
