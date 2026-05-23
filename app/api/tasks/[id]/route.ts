import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  owner: z.string().optional().nullable(),
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  completedAt: z.string().transform((s) => new Date(s)).optional().nullable(),
  dependencyIds: z.array(z.string()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        dependsOn: { include: { dependency: true } },
        dependedOnBy: { include: { dependent: true } },
      },
    });
    if (!task) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(task);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dependencyIds, ...taskData } = UpdateTaskSchema.parse(body);

    // Auto-set completedAt when status changes to DONE
    if (taskData.status === "DONE" && !taskData.completedAt) {
      (taskData as any).completedAt = new Date();
    }
    if (taskData.status && taskData.status !== "DONE") {
      (taskData as any).completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        ...(dependencyIds !== undefined && {
          dependsOn: {
            deleteMany: {},
            create: dependencyIds.map((depId) => ({ dependencyId: depId })),
          },
        }),
      },
      include: {
        dependsOn: { include: { dependency: true } },
        dependedOnBy: { include: { dependent: true } },
      },
    });
    return Response.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
