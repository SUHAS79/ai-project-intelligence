import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifyMany, getProjectMemberIdsByRole } from "@/lib/notify";

const CreateEscalationSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  targetRole: z.enum(["manager", "senior_developer", "both"]),
});

// GET /api/escalations
// - Developer: their own escalations (sent by them)
// - Senior Dev: escalations targeting senior_developer or both, on their projects
// - Manager: all escalations
export async function GET(req: NextRequest) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let escalations;

  if (user.role === "manager") {
    escalations = await prisma.escalation.findMany({
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true, status: true, priority: true } },
        createdBy: { select: { id: true, fullName: true, initials: true, role: true } },
        respondedBy: { select: { id: true, fullName: true, initials: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (user.role === "senior_developer") {
    // Escalations targeting senior_developer or both, on projects they're a member of
    escalations = await prisma.escalation.findMany({
      where: {
        targetRole: { in: ["senior_developer", "both"] },
        project: { members: { some: { userId: user.userId } } },
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true, status: true, priority: true } },
        createdBy: { select: { id: true, fullName: true, initials: true, role: true } },
        respondedBy: { select: { id: true, fullName: true, initials: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Developer: only their own escalations
    escalations = await prisma.escalation.findMany({
      where: { createdById: user.userId },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true, status: true, priority: true } },
        createdBy: { select: { id: true, fullName: true, initials: true, role: true } },
        respondedBy: { select: { id: true, fullName: true, initials: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(escalations);
}

// POST /api/escalations
// Developer/Senior Dev can create escalations
export async function POST(req: NextRequest) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateEscalationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { projectId, taskId, message, targetRole } = parsed.data;

  // Verify user is a member of the project
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.userId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this project" }, { status: 403 });
  }

  const escalation = await prisma.escalation.create({
    data: {
      projectId,
      taskId: taskId || null,
      createdById: user.userId,
      message,
      targetRole,
      status: "OPEN",
    },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true, status: true, priority: true } },
      createdBy: { select: { id: true, fullName: true, initials: true, role: true } },
      respondedBy: { select: { id: true, fullName: true, initials: true } },
    },
  });

  // Notify users whose role matches targetRole within this project
  const rolesToNotify =
    targetRole === "both"
      ? ["manager", "senior_developer"]
      : [targetRole];
  const recipientIds = await getProjectMemberIdsByRole(projectId, rolesToNotify, user.userId);
  await notifyMany(
    recipientIds,
    "escalation_received",
    "New escalation",
    `${user.fullName} raised an escalation${escalation.task ? ` on "${escalation.task.title}"` : ""}: ${message.slice(0, 80)}${message.length > 80 ? "…" : ""}`,
    `/projects/${projectId}?tab=escalations`
  );

  return NextResponse.json(escalation, { status: 201 });
}
