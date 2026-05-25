import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";

const MS_PER_DAY = 86_400_000;

// ── GET /api/templates — list all templates (manager only) ─────────────────

export async function GET() {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== "manager") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const templates = await prisma.projectTemplate.findMany({
      include: {
        createdBy: { select: { fullName: true, initials: true } },
        _count: { select: { tasks: true, risks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ templates });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

// ── POST /api/templates ────────────────────────────────────────────────────
// Body option A: { name, description?, fromProjectId } → save existing project as template
// Body option B: not used (templates only created from existing projects via UI)

const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  fromProjectId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== "manager") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, fromProjectId } = CreateTemplateSchema.parse(body);

    if (fromProjectId) {
      // ── Save an existing project as a template ─────────────────────────
      const project = await prisma.project.findUnique({
        where: { id: fromProjectId },
        include: { tasks: true, risks: true },
      });
      if (!project) {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }

      const projectStart = new Date(project.startDate).getTime();
      const projectEnd   = new Date(project.endDate).getTime();
      const durationDays = Math.max(1, Math.round((projectEnd - projectStart) / MS_PER_DAY));

      const template = await prisma.projectTemplate.create({
        data: {
          name,
          description: description ?? project.description,
          durationDays,
          createdById: user.userId,
          tasks: {
            create: project.tasks.map((t) => {
              const taskStart = new Date(t.startDate).getTime();
              const taskEnd   = new Date(t.endDate).getTime();
              const startDayOffset = Math.max(0, Math.round((taskStart - projectStart) / MS_PER_DAY));
              const taskDuration   = Math.max(1, Math.round((taskEnd - taskStart) / MS_PER_DAY));
              return {
                title: t.title,
                description: t.description,
                priority: t.priority,
                estimatedHours: t.estimatedHours,
                startDayOffset,
                durationDays: taskDuration,
              };
            }),
          },
          risks: {
            create: project.risks.map((r) => ({
              title: r.title,
              description: r.description,
              probability: r.probability,
              impact: r.impact,
              mitigation: r.mitigation,
            })),
          },
        },
        include: {
          _count: { select: { tasks: true, risks: true } },
        },
      });

      return Response.json({ template }, { status: 201 });
    }

    return Response.json({ error: "fromProjectId is required" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to create template" }, { status: 500 });
  }
}
