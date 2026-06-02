import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { computeInitials, SIGNUP_ROLES } from "@/lib/roles";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(SIGNUP_ROLES),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, role } = RegisterSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashed,
        role,
        status: "active",
        initials: computeInitials(fullName),
        lastLogin: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        initials: true,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      initials: user.initials,
    });

    const response = Response.json({ user }, { status: 201 });
    response.headers.set(
      "Set-Cookie",
      `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
    );
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return Response.json(
      { error: "Could not create your account. Please try again." },
      { status: 500 }
    );
  }
}
