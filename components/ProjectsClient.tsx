"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";
import { Button } from "./ui/Button";
import { Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Project, Risk } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "@/lib/insights";

type ProjectWithInsights = Project & {
  tasks: any[];
  risks: Risk[];
  insights: ProjectInsights;
};

export function ProjectsClient({
  initialProjects,
}: {
  initialProjects: ProjectWithInsights[];
}) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">
            {initialProjects.length} {initialProjects.length === 1 ? "project" : "projects"} in your portfolio
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Grid / empty state */}
      {initialProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-6 h-6 text-violet-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1.5">No projects yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
            Create your first project to start getting neural-powered insights.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-3.5 h-3.5" />
            Create project
          </Button>
        </div>
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
