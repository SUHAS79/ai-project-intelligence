import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

// GET /api/reviews — returns IN_REVIEW tasks scoped by role
// Senior Dev: tasks in projects they are a member of
// Manager: all tasks
export async function GET(_request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (user.role !== "senior_developer" && user.role !== "manager") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const where =
      user.role === "manager"
        ? { status: "IN_REVIEW" }
        : {
            status: "IN_REVIEW",
            project: {
              members: { some: { userId: user.userId } },
            },
          };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true, initials: true } },
        activities: {
          where: { action: "submitted_for_review" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { submittedForReviewAt: "asc" },
    });

    return Response.json(tasks);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch review queue" }, { status: 500 });
  }
}
