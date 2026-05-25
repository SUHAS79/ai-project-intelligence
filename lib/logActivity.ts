/**
 * Server-only activity logging helper.
 * Wrapped in try/catch — log failures must NEVER break the action that triggered them.
 */
import { prisma } from "@/lib/prisma";

export interface ActivityActor {
  id?: string;
  name: string;
  role: string;
}

/**
 * Write one entry to the project activity log.
 * @param projectId  - The project this event belongs to
 * @param entityType - "task" | "escalation" | "meeting" | "member" | "project"
 * @param entityId   - ID of the entity being acted on
 * @param entityTitle - Snapshot of the entity's name at event time
 * @param action     - Short verb slug (e.g. "created", "approved", "member_added")
 * @param actor      - Who performed the action
 * @param details    - Full human-readable sentence for display
 */
export async function logActivity(
  projectId: string,
  entityType: string,
  entityId: string,
  entityTitle: string,
  action: string,
  actor: ActivityActor,
  details: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        projectId,
        entityType,
        entityId,
        entityTitle,
        action,
        actorId: actor.id ?? null,
        actorName: actor.name,
        actorRole: actor.role,
        details,
      },
    });
  } catch (e) {
    console.error("[logActivity] Failed to write activity log:", e);
  }
}
