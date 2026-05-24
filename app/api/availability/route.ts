import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  userId: z.string().optional().nullable(),  // null = company holiday (manager only)
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  type: z.enum(["holiday", "vacation", "sick", "wfh", "partial"]),
  note: z.string().optional(),
});

// GET /api/availability?month=YYYY-MM
// Manager: all entries for the month
// Dev/Senior: their own + company holidays
export async function GET(req: NextRequest) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  // month format: YYYY-MM — filter startDate <= last-day-of-month AND endDate >= first-day-of-month
  let startFilter = "0000-01-01";
  let endFilter = "9999-12-31";
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    startFilter = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate(); // 0th day of next month = last day of this month
    endFilter = `${month}-${String(lastDay).padStart(2, "0")}`;
  }

  let entries;
  if (user.role === "manager") {
    entries = await prisma.availability.findMany({
      where: {
        startDate: { lte: endFilter },
        endDate: { gte: startFilter },
      },
      include: {
        user: { select: { id: true, fullName: true, initials: true, role: true } },
      },
      orderBy: { startDate: "asc" },
    });
  } else {
    // Dev: own entries + company-wide holidays
    entries = await prisma.availability.findMany({
      where: {
        startDate: { lte: endFilter },
        endDate: { gte: startFilter },
        OR: [
          { userId: user.userId },
          { userId: null }, // company holidays
        ],
      },
      include: {
        user: { select: { id: true, fullName: true, initials: true, role: true } },
      },
      orderBy: { startDate: "asc" },
    });
  }

  return NextResponse.json(entries);
}

// POST /api/availability
export async function POST(req: NextRequest) {
  const user = await getUserFromToken();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { startDate, endDate, type, note } = parsed.data;
  let { userId } = parsed.data;

  // Non-managers can only create entries for themselves
  if (user.role !== "manager") {
    userId = user.userId;
    if (type === "holiday") {
      return NextResponse.json({ error: "Only managers can add company holidays" }, { status: 403 });
    }
  }

  // Validate date range
  if (startDate > endDate) {
    return NextResponse.json({ error: "Start date must be before or equal to end date" }, { status: 400 });
  }

  // Auto-approve: holiday (always), sick/wfh/partial (self-managed), vacation needs manager approval
  const autoApprove =
    type === "holiday" ||
    type === "sick" ||
    type === "wfh" ||
    type === "partial" ||
    user.role === "manager";

  const entry = await prisma.availability.create({
    data: {
      userId: userId ?? null,
      startDate,
      endDate,
      type,
      note: note ?? null,
      approved: autoApprove,
    },
    include: {
      user: { select: { id: true, fullName: true, initials: true, role: true } },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
