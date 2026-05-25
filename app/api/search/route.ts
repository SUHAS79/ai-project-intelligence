import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

const MAX_RESULTS = 6;

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
      return Response.json({ projects: [], tasks: [], people: [] });
    }

    const isManager = user.role === "manager";

    // ── Projects ─────────────────────────────────────────────────────────────
    const projectWhere = isManager
      ? {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {
          members: { some: { userId: user.userId } },
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        };

    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: { id: true, name: true, status: true, description: true },
      take: MAX_RESULTS,
      orderBy: { name: "asc" },
    });

    // ── Tasks ─────────────────────────────────────────────────────────────────
    const taskWhere = isManager
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {
          assignedToId: user.userId,
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        };

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        projectId: true,
        project: { select: { name: true } },
      },
      take: MAX_RESULTS,
      orderBy: { title: "asc" },
    });

    // ── People (manager only) ────────────────────────────────────────────────
    let people: { id: string; fullName: string; email: string; role: string; initials: string }[] = [];
    if (isManager) {
      people = await prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: q } },
            { email: { contains: q } },
          ],
        },
        select: { id: true, fullName: true, email: true, role: true, initials: true },
        take: MAX_RESULTS,
        orderBy: { fullName: "asc" },
      });
    }

    return Response.json({ projects, tasks, people });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
