import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/logActivity";

const MS_PER_DAY = 86_400_000;

const ApplyTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  startDate: z.string().min(1),        // YYYY-MM-DD
  endDate: z.string().optional(),      // YYYY-MM-DD — falls back to startDate + template.durationDays
});

// POST /api/templates/[id]/apply — create a new project from a template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== "manager") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, startDate, endDate } = ApplyTemplateSchema.parse(body);

    // Fetch template with tasks + risks
    const template = await prisma.projectTemplate.findUnique({
      where: { id },
      include: { tasks: true, risks: true },
    });
    if (!template) return Response.json({ error: "Template not found" }, { status: 404 });

    const start = new Date(startDate);
    // End date: provided or computed from template duration
    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + template.durationDays * MS_PER_DAY);

    // Create project + tasks + risks in one transaction
    const project = await prisma.project.create({
      data: {
        name,
        description: description ?? template.description,
        status: "ACTIVE",
        startDate: start,
        endDate: end,
        tasks: {
          create: template.tasks.map((tt) => {
            const taskStart = new Date(start.getTime() + tt.startDayOffset * MS_PER_DAY);
            const taskEnd   = new Date(taskStart.getTime() + tt.durationDays * MS_PER_DAY);
            return {
              title: tt.title,
              description: tt.description,
              priority: tt.priority,
              estimatedHours: tt.estimatedHours,
              status: "TODO",
              startDate: taskStart,
              endDate: taskEnd,
            };
          }),
        },
        risks: {
          create: template.risks.map((tr) => ({
            title: tr.title,
            description: tr.description,
            probability: tr.probability,
            impact: tr.impact,
            mitigation: tr.mitigation,
            status: "OPEN",
          })),
        },
      },
    });

    // Log activity
    const actorInfo = { id: user.userId, name: user.fullName, role: user.role };
    await logActivity(
      project.id, "project", project.id, project.name, "created",
      actorInfo,
      `Created project "${project.name}" from template "${template.name}"`
    );

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to apply template" }, { status: 500 });
  }
}
