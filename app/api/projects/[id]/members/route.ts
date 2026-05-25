import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/logActivity";

async function requireAuth() {
  return getUserFromToken();
}

// GET /api/projects/[id]/members — list members for this project
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          initials: true,
        },
      },
    },
    orderBy: { addedAt: "asc" },
  });

  return Response.json({ members });
}

// POST /api/projects/[id]/members — add a member to this project (manager only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth || auth.role !== "manager") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { userId } = z.object({ userId: z.string().min(1) }).parse(body);

    // Check project exists
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    // Upsert to avoid duplicate key errors
    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      create: { projectId: id, userId },
      update: {},
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            initials: true,
          },
        },
      },
    });

    // Activity log
    await logActivity(
      id, "member", userId, user.fullName, "member_added",
      { id: auth.userId, name: auth.fullName, role: auth.role },
      `Added ${user.fullName} to the project`
    );

    return Response.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Add member error:", error);
    return Response.json({ error: "Failed to add member." }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/members — remove a member (manager only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth || auth.role !== "manager") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { userId } = z.object({ userId: z.string().min(1) }).parse(body);

    // Fetch user name before deleting
    const removedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    }).catch(() => null);

    await prisma.projectMember.deleteMany({
      where: { projectId: id, userId },
    });

    // Activity log
    await logActivity(
      id, "member", userId, removedUser?.fullName ?? userId, "member_removed",
      { id: auth.userId, name: auth.fullName, role: auth.role },
      `Removed ${removedUser?.fullName ?? "a member"} from the project`
    );

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Remove member error:", error);
    return Response.json({ error: "Failed to remove member." }, { status: 500 });
  }
}
