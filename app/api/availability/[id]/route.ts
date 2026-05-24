import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// PATCH /api/availability/[id] — approve or reject (manager only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "manager") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { approved } = z.object({ approved: z.boolean() }).parse(body);

  const entry = await prisma.availability.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.availability.update({
    where: { id },
    data: { approved },
    include: {
      user: { select: { id: true, fullName: true, initials: true, role: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/availability/[id] — creator or manager
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.availability.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = entry.userId === user.userId;
  const isManager = user.role === "manager";

  if (!isOwner && !isManager) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.availability.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
