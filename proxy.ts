import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "namo-dev-secret-key-change-in-production"
);

const COOKIE_NAME = "namo-session";

// Paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

// Paths only managers can access (non-managers get redirected to /dev)
function isManagerOnlyPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/people") ||
    pathname.startsWith("/workload") ||
    pathname.startsWith("/api/users")
  );
}

// Paths only developers/senior devs can access (managers get redirected to /)
function isDevOnlyPath(pathname: string): boolean {
  return pathname.startsWith("/dev");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public paths — but redirect already-logged-in users away from /login
  if (isPublicPath(pathname)) {
    if (pathname === "/login") {
      const token = req.cookies.get(COOKIE_NAME)?.value;
      if (token) {
        try {
          const { payload } = await jwtVerify(token, JWT_SECRET);
          const role = payload.role as string;
          const dest = role === "manager" ? "/" : "/dev";
          return NextResponse.redirect(new URL(dest, req.url));
        } catch {
          // Invalid token — let them through to /login
        }
      }
    }
    return NextResponse.next();
  }

  // All other paths require a valid session
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Manager trying to access a dev-only route → redirect to manager dashboard
    if (isDevOnlyPath(pathname) && role === "manager") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Non-manager trying to access a manager-only route → redirect to dev dashboard
    if (isManagerOnlyPath(pathname) && role !== "manager") {
      return NextResponse.redirect(new URL("/dev", req.url));
    }

    // /profile is accessible to all authenticated users — no redirect needed

    return NextResponse.next();
  } catch {
    // Token expired or invalid — clear it and redirect to login
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
