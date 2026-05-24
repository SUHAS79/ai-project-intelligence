import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.status === "inactive") {
      return Response.json(
        {
          error:
            "Your account has been deactivated. Please contact your manager.",
        },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      initials: user.initials,
    });

    const response = Response.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        initials: user.initials,
      },
    });

    response.headers.set(
      "Set-Cookie",
      `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
    );

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }
    console.error("Login error:", error);
    return Response.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
