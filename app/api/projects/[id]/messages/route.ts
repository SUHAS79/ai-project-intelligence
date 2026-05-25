import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/projects/[id]/messages — fetch project chat messages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  // Verify project exists and user is a member (or manager)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      members: { select: { userId: true } },
    },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const isMember =
    user.role === "manager" ||
    project.members.some((m) => m.userId === user.userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await prisma.projectMessage.findMany({
    where: { projectId },
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
    messages: messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

// POST /api/projects/[id]/messages — post a message to project chat
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const bodyJson = await req.json();
  const text = (bodyJson.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });

  // Verify project and membership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, members: { select: { userId: true } } },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const isMember =
    user.role === "manager" ||
    project.members.some((m) => m.userId === user.userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const message = await prisma.projectMessage.create({
    data: {
      projectId,
      userId: user.userId,
      userFullName: user.fullName,
      userRole: user.role,
      userInitials: user.initials,
      body: text,
    },
  });

  return NextResponse.json({
    message: { ...message, createdAt: message.createdAt.toISOString() },
  });
}
