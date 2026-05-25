import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateMeetingSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  projectId: z.string().min(1, "Project is required"),
  meetingType: z.enum(["team", "individual"]).default("team"),
  participantId: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(), // ISO datetime string
});

export const MEETING_INCLUDE = {
  project: { select: { id: true, name: true } },
  createdBy: { select: { id: true, fullName: true, initials: true, role: true } },
  participant: { select: { id: true, fullName: true, initials: true, role: true } },
} as const;

// GET /api/meetings — all meetings
export async function GET(req: NextRequest) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // All authenticated users can see all meetings (team-wide visibility)
  const meetings = await prisma.meeting.findMany({
    include: MEETING_INCLUDE,
    orderBy: [
      { status: "asc" },         // scheduled first
      { scheduledAt: "asc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(meetings);
}

// POST /api/meetings — create a new meeting (project is required)
export async function POST(req: NextRequest) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { title, projectId, meetingType, participantId, scheduledAt } = parsed.data;

  // Verify project exists and user can access it
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, members: { select: { userId: true } } },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // For non-managers, verify they are a project member
  if (user.role !== "manager") {
    const isMember = project.members.some((m) => m.userId === user.userId);
    if (!isMember) {
      return NextResponse.json({ error: "You are not a member of this project" }, { status: 403 });
    }
  }

  // For individual meeting, verify participant is a project member
  if (meetingType === "individual" && participantId) {
    const isParticipantMember = project.members.some((m) => m.userId === participantId);
    if (!isParticipantMember) {
      return NextResponse.json({ error: "Participant must be a project member" }, { status: 400 });
    }
  }

  // Generate a unique, URL-safe room name
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const roomName = `namo-${slug}-${Math.random().toString(36).slice(2, 8)}`;

  const meeting = await prisma.meeting.create({
    data: {
      title,
      projectId,
      meetingType,
      participantId: meetingType === "individual" ? (participantId ?? null) : null,
      roomName,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      createdById: user.userId,
      status: "scheduled",
    },
    include: MEETING_INCLUDE,
  });

  return NextResponse.json(meeting, { status: 201 });
}
