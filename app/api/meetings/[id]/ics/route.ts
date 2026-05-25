import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { buildICSFile } from "@/lib/ics";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { fullName: true } },
    },
  });
  if (!meeting) return Response.json({ error: "Meeting not found" }, { status: 404 });

  const jitsiUrl = `https://meet.jit.si/${meeting.roomName}`;

  // Use scheduledAt if set; fall back to createdAt for on-demand meetings
  const start = meeting.scheduledAt
    ? new Date(meeting.scheduledAt)
    : new Date(meeting.createdAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

  const description = [
    meeting.project ? `Project: ${meeting.project.name}` : null,
    `Type: ${meeting.meetingType === "individual" ? "1-on-1" : "Team meeting"}`,
    `Organizer: ${meeting.createdBy.fullName}`,
    `Join: ${jitsiUrl}`,
  ]
    .filter(Boolean)
    .join("\\n");

  const event = {
    uid: `meeting-${meeting.id}@namo.app`,
    summary: meeting.title,
    description,
    url: jitsiUrl,
    allDay: false as const,
    dtstart: start,
    dtend: end,
  };

  const icsContent = buildICSFile([event], "NAMO Meetings");
  const safeFilename = meeting.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();

  return new Response(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
