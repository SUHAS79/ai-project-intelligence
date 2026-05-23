"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task, Project } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "@/lib/insights";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { TaskModal } from "../TaskModal";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
  daysFromNow,
  cn,
} from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ListTodo,
} from "lucide-react";
import { toast } from "sonner";

type TaskWithDeps = Task & { dependsOn: any[]; dependedOnBy: any[] };

interface TasksTabProps {
  project: Project;
  tasks: TaskWithDeps[];
  insights: ProjectInsights;
}

const STATUS_FILTER_LABELS: Record<string, string> = {
  ALL: "All",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

export function TasksTab({ project, tasks, insights }: TasksTabProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDeps | null>(null);
  const [filter, setFilter] = useState<"ALL" | "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE">("ALL");

  const filteredTasks = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);

  const isOverdue = (task: Task) =>
    task.status !== "DONE" && daysFromNow(task.endDate) < 0;

  const handleCreate = async (data: any) => {
    const res = await fetch(`/api/projects/${project.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create task");
    toast.success("Task created");
    router.refresh();
  };

  const handleUpdate = async (data: any) => {
    if (!editingTask) return;
    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update task");
    toast.success("Task updated");
    setEditingTask(null);
    router.refresh();
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed to delete task");
    toast.success("Task deleted");
    router.refresh();
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return toast.error("Failed to update status");
    router.refresh();
  };

  const availableForDeps = tasks.filter((t) => editingTask ? t.id !== editingTask.id : true);

  return (
    <div className="max-w-5xl space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm">
          {(["ALL", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const).map((s) => {
            const count = s === "ALL" ? tasks.length : tasks.filter((t) => t.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  filter === s
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {STATUS_FILTER_LABELS[s]}
                <span className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  filter === s ? "bg-violet-500 text-violet-100" : "bg-slate-100 text-slate-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </Button>
      </div>

      {/* Task Table */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ListTodo className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">
            {filter === "ALL" ? "No tasks yet" : `No ${STATUS_FILTER_LABELS[filter].toLowerCase()} tasks`}
          </p>
          <p className="text-sm text-slate-400">
            {filter === "ALL" ? "Add your first task to start tracking progress" : "Switch filters to see other tasks"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Task</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Owner</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Due</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTasks.map((task) => {
                const statusCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
                const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                const overdue = isOverdue(task);
                const days = daysFromNow(task.endDate);
                const dueSoon = !overdue && days >= 0 && days <= 3 && task.status !== "DONE";

                return (
                  <tr
                    key={task.id}
                    className={cn(
                      "hover:bg-slate-50/60 transition-colors group",
                      overdue && "bg-red-50/40"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900 flex items-center gap-2 flex-wrap">
                        {task.title}
                        {overdue && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                        {dueSoon && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            Due soon
                          </span>
                        )}
                      </div>
                      {task.dependsOn.length > 0 && (
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          {task.dependsOn.length} {task.dependsOn.length === 1 ? "dependency" : "dependencies"}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        className={cn(
                          "text-xs rounded-lg border px-2 py-1 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-200 appearance-none",
                          statusCfg.color
                        )}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="DONE">Done</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge className={priorityCfg.color}>{priorityCfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      {task.owner ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-[11px] font-bold text-violet-600 shrink-0">
                            {task.owner.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-700 truncate max-w-[100px]">{task.owner}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "text-sm",
                        overdue ? "text-red-500 font-medium" : "text-slate-500"
                      )}>
                        {formatDate(task.endDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <TaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        availableTasks={tasks}
      />
      {editingTask && (
        <TaskModal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdate}
          task={editingTask}
          availableTasks={availableForDeps}
          title="Edit Task"
        />
      )}
    </div>
  );
}
