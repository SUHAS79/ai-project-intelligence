import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";
import { notifyMany } from "@/lib/notify";

async function requireManager() {
  const payload = await getUserFromToken();
  if (!payload || payload.role !== "manager") return null;
  return payload;
}

// GET /api/users/[id]/projects — list projects this user is a member of
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const manager = await requireManager();
  if (!manager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const memberships = await prisma.projectMember.findMany({
    where: { userId: id },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { addedAt: "asc" },
  });

  return NextResponse.json({ projects: memberships.map((m) => m.project) });
}

// PUT /api/users/[id]/projects — replace project memberships for this user
// Body: { projectIds: string[] }
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const manager = await requireManager();
  if (!manager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Validate user exists
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let projectIds: string[];
  try {
    const body = await req.json();
    ({ projectIds } = z.object({ projectIds: z.array(z.string()) }).parse(body));
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Get current memberships
  const current = await prisma.projectMember.findMany({
    where: { userId: id },
    select: { projectId: true },
  });
  const currentIds = new Set(current.map((m) => m.projectId));
  const newIds = new Set(projectIds);

  const toAdd = projectIds.filter((pid) => !currentIds.has(pid));
  const toRemove = [...currentIds].filter((pid) => !newIds.has(pid));

  // Fetch project names for notification bodies (only for newly added projects)
  const addedProjects =
    toAdd.length > 0
      ? await prisma.project.findMany({
          where: { id: { in: toAdd } },
          select: { id: true, name: true },
        })
      : [];

  // Apply diff in a transaction
  await prisma.$transaction([
    ...(toRemove.length > 0
      ? [prisma.projectMember.deleteMany({ where: { userId: id, projectId: { in: toRemove } } })]
      : []),
    ...toAdd.map((projectId) =>
      prisma.projectMember.create({ data: { projectId, userId: id } })
    ),
  ]);

  // Notify user about each newly added project (skip if they added themselves, which managers can't do)
  for (const proj of addedProjects) {
    await notifyMany(
      [id],
      "project_assigned",
      "Added to a project",
      `${manager.fullName} added you to "${proj.name}".`,
      `/projects/${proj.id}`
    );
  }

  // Return updated list
  const updated = await prisma.projectMember.findMany({
    where: { userId: id },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { addedAt: "asc" },
  });

  return NextResponse.json({ projects: updated.map((m) => m.project) });
}
