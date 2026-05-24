"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { Task } from "@/app/generated/prisma/client";
import { format } from "date-fns";

const TaskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  assignedToId: z.string().optional().nullable(),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  dependencyIds: z.array(z.string()).default([]),
});

type TaskFormData = z.infer<typeof TaskFormSchema>;

type AssignableUser = {
  id: string;
  fullName: string;
  initials: string;
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  task?: Task & {
    dependsOn?: { dependencyId: string }[];
    assignedTo?: AssignableUser | null;
  };
  availableTasks?: Task[];
  allUsers?: AssignableUser[];
  title?: string;
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  availableTasks = [],
  allUsers = [],
  title = "Create Task",
}: TaskModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(TaskFormSchema) as any,
    defaultValues: task
      ? {
          title: task.title,
          description: task.description ?? "",
          status: task.status as any,
          priority: task.priority as any,
          assignedToId: (task as any).assignedToId ?? "",
          startDate: format(new Date(task.startDate), "yyyy-MM-dd"),
          endDate: format(new Date(task.endDate), "yyyy-MM-dd"),
          dependencyIds: task.dependsOn?.map((d) => d.dependencyId) ?? [],
        }
      : {
          status: "TODO",
          priority: "MEDIUM",
          assignedToId: "",
          startDate: format(new Date(), "yyyy-MM-dd"),
          endDate: format(new Date(Date.now() + 7 * 86400000), "yyyy-MM-dd"),
          dependencyIds: [],
        },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onFormSubmit = async (data: TaskFormData) => {
    // Convert empty string to null for assignedToId
    const payload = {
      ...data,
      assignedToId: data.assignedToId || null,
    };
    await onSubmit(payload as any);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-4">
        <Input
          label="Task title *"
          placeholder="e.g. Set up CI/CD pipeline"
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          label="Description"
          placeholder="What needs to be done?"
          {...register("description")}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Status *" error={errors.status?.message} {...register("status")}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </Select>

          <Select label="Priority *" error={errors.priority?.message} {...register("priority")}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </div>

        {/* Person / Assignee */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Person</label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            {...register("assignedToId")}
          >
            <option value="">— Unassigned —</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start date *"
            type="date"
            error={errors.startDate?.message}
            {...register("startDate")}
          />
          <Input
            label="End date *"
            type="date"
            error={errors.endDate?.message}
            {...register("endDate")}
          />
        </div>

        {availableTasks.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Dependencies{" "}
              <span className="text-xs text-slate-400 font-normal">
                (tasks that must finish first)
              </span>
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-white">
              {availableTasks.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={t.id}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    {...register("dependencyIds")}
                  />
                  <span className="text-sm text-slate-700 truncate">{t.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {task ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
