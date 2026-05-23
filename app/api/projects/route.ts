import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).default("ACTIVE"),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
});

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
        risks: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(projects);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateProjectSchema.parse(body);
    const project = await prisma.project.create({ data });
    return Response.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to create project" }, { status: 500 });
  }
}
