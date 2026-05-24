import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";

const UpdateUserSchema = z.object({
  role: z.enum(["developer", "senior_developer"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

async function requireManager() {
  const payload = await getUserFromToken();
  if (!payload || payload.role !== "manager") {
    return null;
  }
  return payload;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const manager = await requireManager();
  if (!manager) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = UpdateUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot change a manager's role (no manager-to-manager via this route)
    if (existing.role === "manager") {
      return Response.json(
        { error: "Cannot modify the manager's role or status via this endpoint." },
        { status: 403 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        initials: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return Response.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }
    console.error("Update user error:", error);
    return Response.json({ error: "Failed to update user." }, { status: 500 });
  }
}
