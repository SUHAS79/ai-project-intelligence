import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeInsights } from "@/lib/insights";
import { generatePortfolioReport, type ReportPeriod } from "@/lib/report";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "manager") {
      return Response.json({ error: "Manager access required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const rawPeriod = searchParams.get("period") ?? "weekly";
    const period: ReportPeriod =
      rawPeriod === "daily" || rawPeriod === "monthly" ? rawPeriod : "weekly";

    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          include: {
            dependsOn: { include: { dependency: true } },
            dependedOnBy: { include: { dependent: true } },
          },
        },
        risks: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const projectsWithData = projects.map((p) => ({
      project: p,
      tasks: p.tasks,
      risks: p.risks,
      insights: computeInsights(p.tasks as any, p.risks),
    }));

    const report = generatePortfolioReport(projectsWithData, period);
    return Response.json(report);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to generate portfolio report" }, { status: 500 });
  }
}
