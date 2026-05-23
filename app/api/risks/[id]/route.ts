import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateRiskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  probability: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  impact: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  mitigation: z.string().optional().nullable(),
  status: z.enum(["OPEN", "MITIGATING", "RESOLVED", "ACCEPTED"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = UpdateRiskSchema.parse(body);
    const risk = await prisma.risk.update({ where: { id }, data });
    return Response.json(risk);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to update risk" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.risk.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete risk" }, { status: 500 });
  }
}
