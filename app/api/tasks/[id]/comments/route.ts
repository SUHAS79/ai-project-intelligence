import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/tasks/[id]/comments — fetch all comments for a task
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;

  const comments = await prisma.taskComment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      userFullName: true,
      userRole: true,
      userInitials: true,
      body: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

// POST /api/tasks/[id]/comments — add a comment to a task
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const body = await req.json();
  const text = (body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

  // Verify task exists
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      userId: user.userId,
      userFullName: user.fullName,
      userRole: user.role,
      userInitials: user.initials,
      body: text,
    },
  });

  return NextResponse.json({
    comment: { ...comment, createdAt: comment.createdAt.toISOString() },
  });
}
