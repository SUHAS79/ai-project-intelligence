import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"] as const;

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: z.enum(TASK_STATUSES).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  owner: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  dependencyIds: z.array(z.string()).optional().default([]),
});

export const TASK_INCLUDE = {
  dependsOn: { include: { dependency: true } },
  dependedOnBy: { include: { dependent: true } },
  assignedTo: { select: { id: true, fullName: true, initials: true } },
  reviewedBy: { select: { id: true, fullName: true, initials: true } },
  activities: { orderBy: { createdAt: "desc" as const }, take: 10 },
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      include: TASK_INCLUDE,
      orderBy: { startDate: "asc" },
    });
    return Response.json(tasks);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { dependencyIds, assignedToId, ...taskData } = CreateTaskSchema.parse(body);

    // If assignedToId provided, sync owner string
    let resolvedOwner = taskData.owner ?? null;
    if (assignedToId) {
      const user = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { fullName: true },
      });
      if (user) resolvedOwner = user.fullName;
    }

    const task = await prisma.task.create({
      data: {
        ...taskData,
        owner: resolvedOwner,
        assignedToId: assignedToId ?? null,
        projectId,
        dependsOn: {
          create: dependencyIds.map((depId) => ({ dependencyId: depId })),
        },
      },
      include: TASK_INCLUDE,
    });
    return Response.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to create task" }, { status: 500 });
  }
}
