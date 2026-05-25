import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notify } from "@/lib/notify";
import { logActivity } from "@/lib/logActivity";

const RespondSchema = z.object({
  action: z.enum(["respond", "resolve"]),
  response: z.string().optional(),
});

// PATCH /api/escalations/[id]
// Manager or Senior Dev can respond/resolve an escalation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "developer") {
    return NextResponse.json({ error: "Only managers or senior developers can respond to escalations" }, { status: 403 });
  }

  const { id } = await params;

  const escalation = await prisma.escalation.findUnique({ where: { id } });
  if (!escalation) return NextResponse.json({ error: "Escalation not found" }, { status: 404 });

  if (escalation.status === "RESOLVED") {
    return NextResponse.json({ error: "Escalation is already resolved" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = RespondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { action, response } = parsed.data;

  if (action === "respond" && (!response || response.trim().length < 5)) {
    return NextResponse.json({ error: "Response must be at least 5 characters" }, { status: 400 });
  }

  const updated = await prisma.escalation.update({
    where: { id },
    data: {
      status: action === "resolve" ? "RESOLVED" : "RESPONDED",
      response: response ?? escalation.response,
      respondedById: user.userId,
      respondedAt: new Date(),
    },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true, status: true, priority: true } },
      createdBy: { select: { id: true, fullName: true, initials: true, role: true } },
      respondedBy: { select: { id: true, fullName: true, initials: true } },
    },
  });

  // Activity log
  const escTitle = updated.task ? `Escalation on "${updated.task.title}"` : "Escalation";
  await logActivity(
    escalation.projectId, "escalation", id, escTitle,
    action === "resolve" ? "resolved" : "responded",
    { id: user.userId, name: user.fullName, role: user.role },
    action === "resolve"
      ? `Resolved escalation${updated.task ? ` on "${updated.task.title}"` : ""}`
      : `Responded to escalation${updated.task ? ` on "${updated.task.title}"` : ""}${response ? `: ${response.slice(0, 80)}${response.length > 80 ? "…" : ""}` : ""}`
  );

  // Notify the escalation creator about the response/resolution
  if (escalation.createdById !== user.userId) {
    const isResolved = action === "resolve";
    await notify(
      escalation.createdById,
      isResolved ? "escalation_resolved" : "escalation_responded",
      isResolved ? "Escalation resolved" : "Escalation response received",
      `${user.fullName} ${isResolved ? "resolved" : "responded to"} your escalation${updated.task ? ` on "${updated.task.title}"` : ""}.`,
      `/projects/${escalation.projectId}?tab=escalations`
    );
  }

  return NextResponse.json(updated);
}

// DELETE /api/escalations/[id]
// Only the creator can delete their own OPEN escalation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const escalation = await prisma.escalation.findUnique({ where: { id } });
  if (!escalation) return NextResponse.json({ error: "Escalation not found" }, { status: 404 });

  if (escalation.createdById !== user.userId && user.role !== "manager") {
    return NextResponse.json({ error: "Not authorized to delete this escalation" }, { status: 403 });
  }

  await prisma.escalation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
