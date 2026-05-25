"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Project, Task, Risk } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "@/lib/insights";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { TasksTab } from "./tabs/TasksTab";
import { GanttTab } from "./tabs/GanttTab";
import { RisksTab } from "./tabs/RisksTab";
import { InsightsTab } from "./tabs/InsightsTab";
import { ReportTab } from "./tabs/ReportTab";
import { ForecastTab } from "./tabs/ForecastTab";
import { TeamTab } from "./tabs/TeamTab";
import { ProjectModal } from "./ProjectModal";
import {
  PROJECT_STATUS_CONFIG,
  formatDate,
  daysFromNow,
  getHealthColor,
  cn,
} from "@/lib/utils";
import {
  ArrowLeft,
  CheckSquare,
  GanttChart,
  AlertTriangle,
  Brain,
  FileText,
  Calendar,
  Pencil,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type ProjectMember = {
  id: string;
  userId: string;
  addedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    initials: string;
  };
};

type OrgUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  initials: string;
};

type ProjectWithData = Project & {
  tasks: (Task & { dependsOn: any[]; dependedOnBy: any[] })[];
  risks: Risk[];
};

interface ProjectHubProps {
  project: ProjectWithData;
  insights: ProjectInsights;
  activeTab: string;
  members: ProjectMember[];
  allUsers: OrgUser[];
  isManager: boolean;
  userRole?: string;
}

const TABS = [
  { id: "tasks",    label: "Tasks",      icon: CheckSquare },
  { id: "forecast", label: "Forecast",   icon: TrendingUp },
  { id: "gantt",    label: "Timeline",   icon: GanttChart },
  { id: "risks",    label: "Risks",      icon: AlertTriangle },
  { id: "team",     label: "Team",       icon: Users },
  { id: "insights", label: "AI Insights", icon: Brain },
  { id: "report",   label: "Report",     icon: FileText },
];

export function ProjectHub({ project, insights, activeTab, members, allUsers, isManager, userRole = "manager" }: ProjectHubProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTab, setCurrentTab] = useState(activeTab);

  const statusCfg = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];
  const daysLeft = daysFromNow(project.endDate);
  const healthColor = getHealthColor(insights.healthScore);

  const handleUpdateProject = async (data: any) => {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update project");
    toast.success("Project updated");
    router.refresh();
  };

  const urgentInsights = insights.suggestions.filter(
    (s) => s.severity === "CRITICAL" || s.severity === "HIGH"
  ).length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4">
        <Link
          href={userRole === "manager" ? "/" : "/dev"}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 truncate">{project.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            {project.description && (
              <p className="text-xs text-slate-500 mb-1.5 max-w-xl line-clamp-1">{project.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(project.startDate)} → {formatDate(project.endDate)}
              </span>
              {daysLeft > 0 ? (
                <span>{daysLeft} days remaining</span>
              ) : daysLeft === 0 ? (
                <span className="text-amber-500 font-medium">Due today</span>
              ) : (
                <span className="text-red-500 font-medium">{Math.abs(daysLeft)}d overdue</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Health score */}
            <div className="flex flex-col items-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className={`text-xl font-bold tabular-nums ${healthColor}`}>
                {insights.healthScore}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Health</span>
            </div>
            {isManager && (
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 overflow-x-auto">
        <div className="flex gap-0.5 -mb-px min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap",
                  isActive
                    ? "border-violet-500 text-violet-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === "insights" && urgentInsights > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center">
                    {urgentInsights}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-8 bg-slate-100">
        {currentTab === "tasks"    && <TasksTab    project={project} tasks={project.tasks} insights={insights} allUsers={allUsers} userRole={userRole} isManager={isManager} />}
        {currentTab === "forecast" && <ForecastTab project={project} tasks={project.tasks} />}
        {currentTab === "gantt"    && <GanttTab    tasks={project.tasks} />}
        {currentTab === "risks"    && <RisksTab    projectId={project.id} risks={project.risks} insights={insights} />}
        {currentTab === "team"     && (
          <TeamTab
            projectId={project.id}
            initialMembers={members}
            tasks={project.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              owner: (t as any).owner ?? null,
              assignedToId: (t as any).assignedToId ?? null,
            }))}
            allUsers={allUsers}
            isManager={isManager}
          />
        )}
        {currentTab === "insights" && <InsightsTab insights={insights} tasks={project.tasks} />}
        {currentTab === "report"   && <ReportTab   projectId={project.id} />}
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
