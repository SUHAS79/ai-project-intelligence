import { prisma } from "@/lib/prisma";
import { computeInsights } from "@/lib/insights";
import AppShell from "@/components/AppShell";
import { DashboardClient } from "@/components/DashboardClient";
import { Brain } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await prisma.project.findMany({
    include: {
      tasks: {
        include: {
          dependsOn: { include: { dependency: true } },
          dependedOnBy: { include: { dependent: true } },
        },
      },
      risks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const projectsWithInsights = projects.map((p) => ({
    ...p,
    insights: computeInsights(p.tasks as any, p.risks),
  }));

  return (
    <AppShell>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Project Intelligence</h1>
              <p className="text-sm text-slate-500">AI-powered insights for your team</p>
            </div>
          </div>
        </div>

        <DashboardClient initialProjects={projectsWithInsights} />
      </div>
    </AppShell>
  );
}
