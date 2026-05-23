"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";
import { Button } from "./ui/Button";
import { Plus, FolderOpen, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Project, Risk } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "@/lib/insights";

type ProjectWithInsights = Project & {
  tasks: any[];
  risks: Risk[];
  insights: ProjectInsights;
};

export function DashboardClient({ initialProjects }: { initialProjects: ProjectWithInsights[] }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalProjects = initialProjects.length;
  const totalTasks = initialProjects.reduce((s, p) => s + p.tasks.length, 0);
  const totalBlocked = initialProjects.reduce((s, p) => s + p.insights.stats.blocked, 0);
  const totalOverdue = initialProjects.reduce((s, p) => s + p.insights.stats.overdue, 0);
  const avgHealth = totalProjects > 0
    ? Math.round(initialProjects.reduce((s, p) => s + p.insights.healthScore, 0) / totalProjects)
    : 0;

  const handleCreateProject = async (data: any) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create project");
    const project = await res.json();
    toast.success("Project created!");
    router.push(`/projects/${project.id}`);
    router.refresh();
  };

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Projects"
          value={totalProjects}
          icon={<FolderOpen className="w-5 h-5 text-indigo-500" />}
          color="bg-indigo-50"
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          color="bg-green-50"
        />
        <StatCard
          label="Overdue Tasks"
          value={totalOverdue}
          icon={<TrendingDown className="w-5 h-5 text-orange-500" />}
          color="bg-orange-50"
          alert={totalOverdue > 0}
        />
        <StatCard
          label="Blocked Tasks"
          value={totalBlocked}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          color="bg-red-50"
          alert={totalBlocked > 0}
        />
      </div>

      {/* Projects Section */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
          <p className="text-sm text-slate-500">{totalProjects} project{totalProjects !== 1 ? "s" : ""} · Avg health: {avgHealth}/100</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {initialProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm">
            Create your first project to start tracking tasks, managing risks, and getting AI-powered insights.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {initialProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  alert,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  alert?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>{icon}</div>
        {alert && value > 0 && (
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        )}
      </div>
      <div className={`text-3xl font-bold mb-1 ${alert && value > 0 ? "text-red-500" : "text-slate-900"}`}>
        {value}
      </div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}
