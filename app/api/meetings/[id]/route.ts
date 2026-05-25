import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MEETING_INCLUDE = {
  project:     { select: { id: true, name: true } },
  createdBy:   { select: { id: true, fullName: true, initials: true, role: true } },
  participant: { select: { id: true, fullName: true, initials: true, role: true } },
} as const;

// PATCH /api/meetings/[id] — update status (active | ended) or details
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status } = z.object({
    status: z.enum(["scheduled", "active", "ended"]).optional(),
  }).parse(body);

  const updated = await prisma.meeting.update({
    where: { id },
    data: { ...(status ? { status } : {}) },
    include: MEETING_INCLUDE,
  });

  return NextResponse.json(updated);
}

// DELETE /api/meetings/[id] — creator or manager
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (meeting.createdById !== user.userId && user.role !== "manager") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.meeting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
