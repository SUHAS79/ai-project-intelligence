import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateMeetingSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  projectId: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(), // ISO datetime string
});

const MEETING_INCLUDE = {
  project: { select: { id: true, name: true } },
  createdBy: { select: { id: true, fullName: true, initials: true, role: true } },
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

// POST /api/meetings — create a new meeting
export async function POST(req: NextRequest) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { title, projectId, scheduledAt } = parsed.data;

  // Generate a unique, URL-safe room name
  // Format: namo-{slug}-{short-id}
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const roomName = `namo-${slug}-${Math.random().toString(36).slice(2, 8)}`;

  const meeting = await prisma.meeting.create({
    data: {
      title,
      projectId: projectId ?? null,
      roomName,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      createdById: user.userId,
      status: "scheduled",
    },
    include: MEETING_INCLUDE,
  });

  return NextResponse.json(meeting, { status: 201 });
}
