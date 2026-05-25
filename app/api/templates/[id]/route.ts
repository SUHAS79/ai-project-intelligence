import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

// ── GET /api/templates/[id] ────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== "manager") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const template = await prisma.projectTemplate.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { startDayOffset: "asc" } },
        risks: true,
        createdBy: { select: { fullName: true, initials: true } },
      },
    });

    if (!template) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ template });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

// ── DELETE /api/templates/[id] ─────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== "manager") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.projectTemplate.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
