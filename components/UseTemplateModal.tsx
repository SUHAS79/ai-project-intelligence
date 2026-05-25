"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { ListTodo, ShieldAlert, Calendar, ArrowLeft } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

interface TemplateInfo {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  _count: { tasks: number; risks: number };
}

interface UseTemplateModalProps {
  template: TemplateInfo;
  onClose: () => void;
}

export function UseTemplateModal({ template, onClose }: UseTemplateModalProps) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultEnd = format(addDays(new Date(), template.durationDays), "yyyy-MM-dd");

  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recompute end date when start changes (maintain template duration)
  function handleStartChange(val: string) {
    setStartDate(val);
    if (val) {
      const newEnd = format(addDays(new Date(val), template.durationDays), "yyyy-MM-dd");
      setEndDate(newEnd);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Project name is required."); return; }
    if (!startDate)   { setError("Start date is required."); return; }
    if (endDate && endDate < startDate) { setError("End date must be on or after start date."); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/templates/${template.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description || null, startDate, endDate }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create project");
      }

      const { project } = await res.json();
      toast.success(`"${project.name}" created from template`);
      onClose();
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Create Project from Template" size="md">
      {/* Template preview */}
      <div className="mb-5 p-3.5 bg-violet-50 border border-violet-100 rounded-xl">
        <p className="text-xs font-semibold text-violet-700 mb-1">Template: {template.name}</p>
        <div className="flex items-center gap-3 text-xs text-violet-600">
          <span className="flex items-center gap-1">
            <ListTodo className="w-3 h-3" />
            {template._count.tasks} task{template._count.tasks !== 1 ? "s" : ""}
          </span>
          {template._count.risks > 0 && (
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              {template._count.risks} risk{template._count.risks !== 1 ? "s" : ""}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            ~{template.durationDays}d duration
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mobile App v2"
          required
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional project overview"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Start date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
