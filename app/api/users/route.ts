import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { computeInitials } from "@/lib/roles";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["developer", "senior_developer"]),
  status: z.enum(["active", "inactive"]).default("active"),
});

async function requireManager() {
  const payload = await getUserFromToken();
  if (!payload || payload.role !== "manager") {
    return null;
  }
  return payload;
}

export async function GET() {
  const manager = await requireManager();
  if (!manager) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
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
    orderBy: { fullName: "asc" },
  });

  return Response.json({ users });
}

export async function POST(req: NextRequest) {
  const manager = await requireManager();
  if (!manager) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = CreateUserSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashed,
        role: data.role,
        status: data.status,
        initials: computeInitials(data.fullName),
      },
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

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }
    console.error("Create user error:", error);
    return Response.json({ error: "Failed to create user." }, { status: 500 });
  }
}
