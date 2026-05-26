import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { buildICSFile } from "@/lib/ics";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  // Role-scoped: manager sees all tasks; dev/senior only their own
  const where =
    user.role === "manager"
      ? { projectId: id }
      : { projectId: id, assignedToId: user.userId };

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      startDate: true,
      endDate: true,
      assignedTo: { select: { fullName: true } },
    },
    orderBy: { startDate: "asc" },
  });

  // Prefer an explicit env override; otherwise derive the origin from the
  // request so calendar links resolve correctly on every deployment.
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ??
    (host ? `${proto}://${host}` : "http://localhost:3000");

  const events = tasks.map((task) => ({
    uid: `task-${task.id}@namo.app`,
    summary: task.title,
    description: [
      `Status: ${task.status.replace(/_/g, " ")}`,
      `Priority: ${task.priority}`,
      task.assignedTo ? `Assigned to: ${task.assignedTo.fullName}` : null,
      task.description ?? null,
    ]
      .filter(Boolean)
      .join("\\n"),
    url: `${APP_URL}/projects/${id}`,
    allDay: true as const,
    dtstart: new Date(task.startDate),
    // DTEND for all-day = day AFTER last day (RFC 5545 §3.6.1)
    dtend: new Date(new Date(task.endDate).getTime() + MS_PER_DAY),
  }));

  const icsContent = buildICSFile(events, project.name);
  const safeFilename = project.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

  return new Response(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}-tasks.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
