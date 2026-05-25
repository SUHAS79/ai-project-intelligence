/**
 * Server-only notification helpers.
 * Wrap all DB calls in try/catch — a notification failure must NEVER break
 * the action that triggered it.
 */
import { prisma } from "@/lib/prisma";

/** Create a single notification for one user. */
export async function notify(
  userId: string,
  type: string,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, link: link ?? null },
    });
  } catch (e) {
    console.error("[notify] Failed to create notification:", e);
  }
}

/** Create the same notification for multiple users in one batch. */
export async function notifyMany(
  userIds: string[],
  type: string,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        body,
        link: link ?? null,
      })),
    });
  } catch (e) {
    console.error("[notify] Failed to create notifications:", e);
  }
}

/**
 * Fetch all project members whose role matches the given set,
 * excluding a specific userId (e.g., the actor who triggered the event).
 */
export async function getProjectMemberIdsByRole(
  projectId: string,
  roles: string[],
  excludeUserId?: string
): Promise<string[]> {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, role: true } } },
  });
  return members
    .filter(
      (m) =>
        roles.includes(m.user.role) &&
        (!excludeUserId || m.user.id !== excludeUserId)
    )
    .map((m) => m.user.id);
}
