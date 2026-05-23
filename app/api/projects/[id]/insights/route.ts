import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeInsights } from "@/lib/insights";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [tasks, risks] = await Promise.all([
      prisma.task.findMany({
        where: { projectId: id },
        include: {
          dependsOn: { include: { dependency: true } },
          dependedOnBy: { include: { dependent: true } },
        },
      }),
      prisma.risk.findMany({ where: { projectId: id } }),
    ]);
    const insights = computeInsights(tasks as any, risks);
    return Response.json(insights);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to compute insights" }, { status: 500 });
  }
}
