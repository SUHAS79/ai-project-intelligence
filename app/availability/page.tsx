import AppShell from "@/components/AppShell";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const user = await getUserFromToken();
  if (!user) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const startFilter = `${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endFilter = `${monthStr}-${String(lastDay).padStart(2, "0")}`;

  // Fetch this month's availability
  let initialEntries;
  if (user.role === "manager") {
    initialEntries = await prisma.availability.findMany({
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
    initialEntries = await prisma.availability.findMany({
      where: {
        startDate: { lte: endFilter },
        endDate: { gte: startFilter },
        OR: [{ userId: user.userId }, { userId: null }],
      },
      include: {
        user: { select: { id: true, fullName: true, initials: true, role: true } },
      },
      orderBy: { startDate: "asc" },
    });
  }

  // Team members for the manager's "add for user" select
  const teamMembers =
    user.role === "manager"
      ? await prisma.user.findMany({
          where: { status: "active" },
          select: { id: true, fullName: true, initials: true, role: true },
          orderBy: { fullName: "asc" },
        })
      : [];

  return (
    <AppShell>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Team Calendar</h1>
            <p className="text-sm text-slate-500">
              {user.role === "manager"
                ? "Manage team availability, approve requests, and add company holidays."
                : "View team availability and request days off."}
            </p>
          </div>
        </div>

        <AvailabilityCalendar
          userRole={user.role}
          userId={user.userId}
          teamMembers={teamMembers}
          initialEntries={initialEntries as any}
          initialYear={year}
          initialMonth={month}
        />
      </div>
    </AppShell>
  );
}
