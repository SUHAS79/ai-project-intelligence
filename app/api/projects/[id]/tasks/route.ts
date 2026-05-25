import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";
import { notify } from "@/lib/notify";
import { logActivity } from "@/lib/logActivity";

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"] as const;

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: z.enum(TASK_STATUSES).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  owner: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  estimatedHours: z.number().min(0).optional().nullable(),
  actualHours: z.number().min(0).optional().nullable(),
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
    const user = await getUserFromToken();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Managers see all tasks; dev/senior only see their own assigned tasks
    const where =
      user.role === "manager"
        ? { projectId: id }
        : { projectId: id, assignedToId: user.userId };

    const tasks = await prisma.task.findMany({
      where,
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

    // Notifications + activity log (fire-and-forget)
    const actor = await getUserFromToken().catch(() => null);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    }).catch(() => null);

    // Activity: task created
    if (actor) {
      await logActivity(
        projectId,
        "task",
        task.id,
        task.title,
        "created",
        { id: actor.userId, name: actor.fullName, role: actor.role },
        `Created task "${task.title}"`
      );
    }

    // Activity: assignment (if task created with an assignee)
    if (assignedToId && actor) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { fullName: true },
      }).catch(() => null);
      if (assignee) {
        await logActivity(
          projectId,
          "task",
          task.id,
          task.title,
          "assigned",
          { id: actor.userId, name: actor.fullName, role: actor.role },
          `Assigned "${task.title}" to ${assignee.fullName}`
        );
      }
    }

    // Notify assignee (if assigned and not the creator)
    if (assignedToId && (!actor || actor.userId !== assignedToId)) {
      await notify(
        assignedToId,
        "task_assigned",
        "New task assigned to you",
        `"${task.title}" in ${project?.name ?? "a project"} has been assigned to you.`,
        `/projects/${projectId}?tab=tasks`
      );
    }

    return Response.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to create task" }, { status: 500 });
  }
}
