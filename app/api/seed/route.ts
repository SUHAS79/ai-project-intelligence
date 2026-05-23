import { NextRequest } from "next/server";

export async function POST(_request: NextRequest) {
  // Trigger seed via exec - only for dev use
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available in production" }, { status: 403 });
  }
  return Response.json({ message: "Use npm run seed from the command line" });
}
