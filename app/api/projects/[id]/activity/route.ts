import { NextRequest } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/activity — project activity log (manager only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "manager") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const activity = await prisma.activityLog.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return Response.json({ activity });
}
