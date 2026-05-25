import AppShell from "@/components/AppShell";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MeetingsClient } from "@/components/MeetingsClient";
import { Video } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const user = await getUserFromToken();
  if (!user) return null;

  const meetingsRaw = await prisma.meeting.findMany({
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, fullName: true, initials: true, role: true } },
      participant: { select: { id: true, fullName: true, initials: true, role: true } },
    },
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
  });

  // Scope available projects by role:
  // - Manager: all active projects
  // - Dev/Senior: only projects they're a member of
  const projects: { id: string; name: string }[] =
    user.role === "manager"
      ? await prisma.project.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : await prisma.projectMember.findMany({
          where: { userId: user.userId },
          include: { project: { select: { id: true, name: true, status: true } } },
          orderBy: { addedAt: "asc" },
        }).then((ms) =>
          ms
            .filter((m) => m.project.status === "ACTIVE")
            .map((m) => ({ id: m.project.id, name: m.project.name }))
        );

  // Serialize dates → strings so client component receives plain strings, not Date objects
  const meetings = meetingsRaw.map((m) => ({
    ...m,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <Video className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Meetings</h1>
            <p className="text-sm text-slate-500">
              Start or schedule video meetings powered by Jitsi Meet — no account required.
            </p>
          </div>
        </div>

        <MeetingsClient
          user={user}
          initialMeetings={meetings}
          projects={projects}
        />
      </div>
    </AppShell>
  );
}
