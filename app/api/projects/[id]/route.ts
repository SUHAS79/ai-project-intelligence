import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z.string().transform((s) => new Date(s)).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            dependsOn: { include: { dependency: true } },
            dependedOnBy: { include: { dependent: true } },
          },
        },
        risks: true,
      },
    });
    if (!project) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(project);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = UpdateProjectSchema.parse(body);
    const project = await prisma.project.update({ where: { id }, data });
    return Response.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
