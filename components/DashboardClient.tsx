"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";
import { Button } from "./ui/Button";
import { Plus, FolderOpen, TrendingDown, ShieldAlert, CheckCircle2, Zap, Target } from "lucide-react";
import { toast } from "sonner";
import { Project, Risk } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "@/lib/insights";
import { getHealthColor } from "@/lib/utils";

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
  const totalDone = initialProjects.reduce((s, p) => s + p.insights.stats.done, 0);
  const avgHealth =
    totalProjects > 0
      ? Math.round(initialProjects.reduce((s, p) => s + p.insights.healthScore, 0) / totalProjects)
      : 0;

  const criticalProjects = initialProjects.filter((p) => p.insights.healthLabel === "Critical").length;
  const atRiskProjects = initialProjects.filter((p) => p.insights.healthLabel === "At Risk").length;

  const handleCreateProject = async (data: any) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create project");
    const project = await res.json();
    toast.success("Project created");
    router.push(`/projects/${project.id}`);
    router.refresh();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow shadow-violet-200">
              <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">NAMO</h1>
          </div>
          <p className="text-sm text-slate-500 ml-9">
            Neural Analytics for Management Optimization
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-3.5 h-3.5" />
          New Project
        </Button>
      </div>

      {/* Summary band */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        <MetricCard
          label="Portfolio Health"
          value={`${avgHealth}`}
          sub="/100"
          color={getHealthColor(avgHealth)}
          icon={<Target className="w-4 h-4" />}
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
        />
        <MetricCard
          label="Projects"
          value={`${totalProjects}`}
          icon={<FolderOpen className="w-4 h-4" />}
          iconBg="bg-slate-100"
          iconColor="text-slate-500"
        />
        <MetricCard
          label="Tasks Complete"
          value={`${totalDone}`}
          sub={`/ ${totalTasks}`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <MetricCard
          label="Overdue"
          value={`${totalOverdue}`}
          alert={totalOverdue > 0}
          icon={<TrendingDown className="w-4 h-4" />}
          iconBg={totalOverdue > 0 ? "bg-orange-50" : "bg-slate-100"}
          iconColor={totalOverdue > 0 ? "text-orange-500" : "text-slate-400"}
        />
        <MetricCard
          label="Blocked"
          value={`${totalBlocked}`}
          alert={totalBlocked > 0}
          icon={<ShieldAlert className="w-4 h-4" />}
          iconBg={totalBlocked > 0 ? "bg-red-50" : "bg-slate-100"}
          iconColor={totalBlocked > 0 ? "text-red-500" : "text-slate-400"}
        />
      </div>

      {/* Alert bar if critical projects */}
      {(criticalProjects > 0 || atRiskProjects > 0) && (
        <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            {criticalProjects > 0 && (
              <span className="font-semibold">{criticalProjects} project{criticalProjects !== 1 ? "s" : ""} critical</span>
            )}
            {criticalProjects > 0 && atRiskProjects > 0 && <span>, </span>}
            {atRiskProjects > 0 && (
              <span className="font-semibold">{atRiskProjects} at risk</span>
            )}
            {" "}— review AI insights to understand root causes.
          </p>
        </div>
      )}

      {/* Projects */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Projects
          <span className="ml-2 text-slate-400 font-normal normal-case">{totalProjects} total</span>
        </h2>
      </div>

      {initialProjects.length === 0 ? (
        <EmptyState onCreateProject={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
    </div>
  );
}

function MetricCard({
  label, value, sub, color, alert, icon, iconBg, iconColor
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  alert?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        {alert && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold tabular-nums ${color ?? (alert ? "text-red-500" : "text-slate-900")}`}>
          {value}
        </span>
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function EmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
        <FolderOpen className="w-6 h-6 text-violet-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1.5">No projects yet</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
        Create your first project to start getting neural-powered insights.
      </p>
      <Button onClick={onCreateProject}>
        <Plus className="w-3.5 h-3.5" />
        Create project
      </Button>
    </div>
  );
}
