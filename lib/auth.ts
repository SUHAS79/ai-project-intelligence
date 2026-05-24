/**
 * Server-only auth utilities.
 * Do NOT import this file in client components — it uses next/headers.
 * For client-safe role constants, import from @/lib/roles instead.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { TokenPayload } from "./roles";

export type { TokenPayload };
export { ROLE_LABELS, ROLE_COLORS, computeInitials } from "./roles";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "namo-dev-secret-key-change-in-production"
);

export const COOKIE_NAME = "namo-session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/** Fast: reads JWT payload from cookie — no DB hit. Good for sidebar/layout. */
export async function getUserFromToken(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Full: fetches latest user record from DB. Use for profile page & sensitive checks. */
export async function getCurrentUser() {
  const payload = await getUserFromToken();
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      initials: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  return user;
}
