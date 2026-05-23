import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateRiskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  probability: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  impact: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  mitigation: z.string().optional().nullable(),
  status: z.enum(["OPEN", "MITIGATING", "RESOLVED", "ACCEPTED"]).default("OPEN"),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const risks = await prisma.risk.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(risks);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch risks" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const data = CreateRiskSchema.parse(body);
    const risk = await prisma.risk.create({ data: { ...data, projectId } });
    return Response.json(risk, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to create risk" }, { status: 500 });
  }
}
