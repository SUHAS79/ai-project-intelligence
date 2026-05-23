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
} from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

type TaskWithDeps = Task & { dependsOn: any[]; dependedOnBy: any[] };

interface TasksTabProps {
  project: Project;
  tasks: TaskWithDeps[];
  insights: ProjectInsights;
}

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
    toast.success("Task created!");
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
    toast.success("Task updated!");
    setEditingTask(null);
    router.refresh();
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed to delete task");
    toast.success("Task deleted!");
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
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1">
          {(["ALL", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const).map((s) => {
            const count = s === "ALL" ? tasks.length : tasks.filter((t) => t.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === s
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {s === "ALL" ? "All" : STATUS_CONFIG[s].label} ({count})
              </button>
            );
          })}
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total", value: insights.stats.total, color: "text-slate-700" },
          { label: "Done", value: insights.stats.done, color: "text-green-600" },
          { label: "In Progress", value: insights.stats.inProgress, color: "text-blue-600" },
          { label: "Blocked", value: insights.stats.blocked, color: "text-red-500" },
          { label: "Overdue", value: insights.stats.overdue, color: "text-orange-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Task Table */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tasks yet</p>
          <p className="text-sm text-slate-400 mt-1">Add your first task to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Task</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Due Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const statusCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
                const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                const overdue = isOverdue(task);
                const days = daysFromNow(task.endDate);

                return (
                  <tr key={task.id} className={`hover:bg-slate-50/50 transition-colors ${overdue ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {task.title}
                        {overdue && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}
                      </div>
                      {task.dependsOn.length > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          {task.dependsOn.length} dependenc{task.dependsOn.length === 1 ? "y" : "ies"}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        className="text-xs rounded-full border px-2.5 py-1 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        style={{ background: "transparent" }}
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
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600">
                            {task.owner.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{task.owner}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className={`text-sm ${overdue ? "text-red-500 font-medium" : "text-slate-600"}`}>
                        {formatDate(task.endDate)}
                      </div>
                      {!overdue && days >= 0 && days <= 3 && task.status !== "DONE" && (
                        <div className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          Due soon
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
