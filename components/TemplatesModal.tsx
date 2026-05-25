"use client";

import { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { UseTemplateModal } from "./UseTemplateModal";
import {
  Layers,
  ListTodo,
  ShieldAlert,
  Calendar,
  Trash2,
  Plus,
  Loader2,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  createdAt: string;
  createdBy: { fullName: string; initials: string };
  _count: { tasks: number; risks: number };
}

interface TemplatesModalProps {
  onClose: () => void;
}

export function TemplatesModal({ onClose }: TemplatesModalProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [usingTemplate, setUsingTemplate] = useState<TemplateItem | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => toast.error("Failed to load templates"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(t: TemplateItem) {
    if (!confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
    setDeleting(t.id);
    try {
      const res = await fetch(`/api/templates/${t.id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((x) => x.id !== t.id));
        toast.success("Template deleted");
      } else {
        toast.error("Failed to delete template");
      }
    } finally {
      setDeleting(null);
    }
  }

  // If user is in "use template" flow, show nested modal on top
  if (usingTemplate) {
    return (
      <UseTemplateModal
        template={usingTemplate}
        onClose={() => setUsingTemplate(null)}
      />
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Project Templates" size="lg">
      {/* Hint */}
      <p className="text-xs text-slate-400 mb-4">
        Save any project as a template to quickly create new projects with the same task structure and risks.
        Use <span className="font-medium text-slate-500">"Save as Template"</span> on any project page.
      </p>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading templates…</span>
        </div>
      )}

      {!loading && templates.length === 0 && (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No templates yet</p>
          <p className="text-xs text-slate-400">
            Open a project and click <span className="font-medium">"Save as Template"</span> to create your first one.
          </p>
        </div>
      )}

      {!loading && templates.length > 0 && (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-violet-200 hover:bg-violet-50/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4 text-violet-600" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">{t.name}</h3>
                  {t.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
                  )}

                  {/* Meta chips */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <ListTodo className="w-3 h-3 text-blue-500" />
                      {t._count.tasks} task{t._count.tasks !== 1 ? "s" : ""}
                    </span>
                    {t._count.risks > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <ShieldAlert className="w-3 h-3 text-orange-500" />
                        {t._count.risks} risk{t._count.risks !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3 text-violet-500" />
                      ~{t.durationDays}d
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <User className="w-3 h-3" />
                      {t.createdBy.fullName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(t.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => setUsingTemplate(t)}
                  >
                    <Plus className="w-3 h-3" />
                    Use
                  </Button>
                  <button
                    onClick={() => handleDelete(t)}
                    disabled={deleting === t.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
