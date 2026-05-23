import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  owner: z.string().optional().nullable(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  dependencyIds: z.array(z.string()).optional().default([]),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      include: {
        dependsOn: { include: { dependency: true } },
        dependedOnBy: { include: { dependent: true } },
      },
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
    const { dependencyIds, ...taskData } = CreateTaskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        ...taskData,
        projectId,
        dependsOn: {
          create: dependencyIds.map((depId) => ({ dependencyId: depId })),
        },
      },
      include: {
        dependsOn: { include: { dependency: true } },
        dependedOnBy: { include: { dependent: true } },
      },
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
