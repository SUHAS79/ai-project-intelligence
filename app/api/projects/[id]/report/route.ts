import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeInsights } from "@/lib/insights";
import { generateReport, type ReportPeriod } from "@/lib/report";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const rawPeriod = searchParams.get("period") ?? "weekly";
    const period: ReportPeriod =
      rawPeriod === "daily" || rawPeriod === "monthly" ? rawPeriod : "weekly";

    const [project, tasks, risks] = await Promise.all([
      prisma.project.findUnique({ where: { id } }),
      prisma.task.findMany({
        where: { projectId: id },
        include: {
          dependsOn: { include: { dependency: true } },
          dependedOnBy: { include: { dependent: true } },
        },
      }),
      prisma.risk.findMany({ where: { projectId: id } }),
    ]);

    if (!project) return Response.json({ error: "Not found" }, { status: 404 });

    const insights = computeInsights(tasks as any, risks);
    const report = generateReport(project, tasks, risks, insights, period);
    return Response.json(report);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
