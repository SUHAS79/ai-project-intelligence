"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Project, Task, Risk } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "@/lib/insights";
import { HealthScore } from "./HealthScore";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { TasksTab } from "./tabs/TasksTab";
import { GanttTab } from "./tabs/GanttTab";
import { RisksTab } from "./tabs/RisksTab";
import { InsightsTab } from "./tabs/InsightsTab";
import { ReportTab } from "./tabs/ReportTab";
import { ProjectModal } from "./ProjectModal";
import {
  PROJECT_STATUS_CONFIG,
  formatDate,
  daysFromNow,
} from "@/lib/utils";
import {
  ArrowLeft,
  BarChart2,
  GanttChart,
  AlertTriangle,
  Brain,
  FileText,
  Calendar,
  Pencil,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";

type ProjectWithData = Project & {
  tasks: (Task & { dependsOn: any[]; dependedOnBy: any[] })[];
  risks: Risk[];
};

interface ProjectHubProps {
  project: ProjectWithData;
  insights: ProjectInsights;
  activeTab: string;
}

const TABS = [
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "gantt", label: "Timeline", icon: GanttChart },
  { id: "risks", label: "Risks", icon: AlertTriangle },
  { id: "insights", label: "AI Insights", icon: Brain },
  { id: "report", label: "Report", icon: FileText },
];

export function ProjectHub({ project, insights, activeTab }: ProjectHubProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTab, setCurrentTab] = useState(activeTab);

  const statusCfg = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];
  const daysLeft = daysFromNow(project.endDate);

  const handleUpdateProject = async (data: any) => {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update project");
    toast.success("Project updated!");
    router.refresh();
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Project Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Projects
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-xl font-bold text-slate-900 truncate">{project.name}</h1>
              <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
            </div>
            {project.description && (
              <p className="text-sm text-slate-500 mb-2 max-w-2xl">{project.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(project.startDate)} → {formatDate(project.endDate)}
              </span>
              {daysLeft > 0 ? (
                <span className="text-slate-500">{daysLeft} days remaining</span>
              ) : daysLeft === 0 ? (
                <span className="text-yellow-600 font-medium">Due today</span>
              ) : (
                <span className="text-red-500 font-medium">{Math.abs(daysLeft)}d overdue</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <HealthScore score={insights.healthScore} label={insights.healthLabel} size="sm" />
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-8">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "insights" && insights.suggestions.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-semibold">
                    {insights.suggestions.filter((s) => s.severity === "CRITICAL" || s.severity === "HIGH").length || insights.suggestions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-8">
        {currentTab === "tasks" && (
          <TasksTab project={project} tasks={project.tasks} insights={insights} />
        )}
        {currentTab === "gantt" && (
          <GanttTab tasks={project.tasks} />
        )}
        {currentTab === "risks" && (
          <RisksTab projectId={project.id} risks={project.risks} insights={insights} />
        )}
        {currentTab === "insights" && (
          <InsightsTab insights={insights} tasks={project.tasks} />
        )}
        {currentTab === "report" && (
          <ReportTab projectId={project.id} />
        )}
      </div>

      <ProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateProject}
        project={project}
        title="Edit Project"
      />
    </div>
  );
}
