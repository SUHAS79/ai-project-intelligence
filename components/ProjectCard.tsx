"use client";

import Link from "next/link";
import { Project, Task, Risk } from "@/app/generated/prisma/client";
import { Badge } from "./ui/Badge";
import { HealthScore } from "./HealthScore";
import { computeInsights } from "@/lib/insights";
import {
  STATUS_CONFIG,
  PROJECT_STATUS_CONFIG,
  formatDate,
  daysFromNow,
} from "@/lib/utils";
import { Calendar, Users, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

interface ProjectCardProps {
  project: Project & { tasks: any[]; risks: Risk[] };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const insights = computeInsights(project.tasks, project.risks);
  const { stats, healthScore, healthLabel } = insights;
  const statusCfg = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];
  const daysLeft = daysFromNow(project.endDate);
  const owners = [...new Set(project.tasks.map((t) => t.owner).filter(Boolean))];

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 group-hover:translate-y-[-1px]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{project.description}</p>
            )}
          </div>
          <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
        </div>

        {/* Health Score */}
        <div className="mb-4">
          <HealthScore score={healthScore} label={healthLabel} size="md" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{stats.done}</div>
            <div className="text-xs text-slate-500">Done</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-xs text-slate-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-500">{stats.blocked}</div>
            <div className="text-xs text-slate-500">Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-500">{project.risks.length}</div>
            <div className="text-xs text-slate-500">Risks</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {daysLeft > 0
              ? `${daysLeft}d remaining`
              : daysLeft === 0
              ? "Due today"
              : `${Math.abs(daysLeft)}d overdue`}
          </div>
          <div className="flex items-center gap-1 text-indigo-500 font-medium">
            View
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}
