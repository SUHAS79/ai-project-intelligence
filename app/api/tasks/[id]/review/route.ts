import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";
import { TASK_INCLUDE } from "../route";
import { notify, notifyMany, getProjectMemberIdsByRole } from "@/lib/notify";
import { logActivity } from "@/lib/logActivity";
import { sendEmailToUser, sendEmailToUsers } from "@/lib/email";

// POST /api/tasks/[id]/review — developer submits task for review
const SubmitSchema = z.object({
  workSummary: z.string().min(1, "Work summary is required"),
  actualHours: z.number().min(0).optional().nullable(),
});

// PATCH /api/tasks/[id]/review — senior dev / manager approves or rejects (or manager reopens)
const ReviewActionSchema = z.object({
  action: z.enum(["approve", "reject", "reopen"]),
  rejectionReason: z.string().optional(),
  reopenReason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { workSummary, actualHours } = SubmitSchema.parse(body);

    // Verify task exists and is IN_PROGRESS
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
    if (task.status !== "IN_PROGRESS") {
      return Response.json(
        { error: "Only in-progress tasks can be submitted for review" },
        { status: 400 }
      );
    }

    const now = new Date();

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: "IN_REVIEW",
        reviewStatus: "PENDING",
        workSummary,
        actualHours: actualHours ?? undefined,
        rejectionReason: null,
        reviewedById: null,
        reviewedAt: null,
        submittedForReviewAt: now,
        activities: {
          create: {
            userId: user.userId,
            userFullName: user.fullName,
            action: "submitted_for_review",
            details: workSummary.slice(0, 200),
          },
        },
      },
      include: TASK_INCLUDE,
    });

    // Activity log
    await logActivity(
      task.projectId, "task", task.id, task.title, "submitted_for_review",
      { id: user.userId, name: user.fullName, role: user.role },
      `Submitted "${task.title}" for review`
    );

    // Notify + email senior devs + managers on this project
    const reviewerIds = await getProjectMemberIdsByRole(
      task.projectId, ["senior_developer", "manager"], user.userId
    );
    const reviewLink = `/projects/${task.projectId}?tab=tasks`;
    await notifyMany(
      reviewerIds, "task_submitted_for_review", "Task submitted for review",
      `${user.fullName} submitted "${task.title}" for review.`,
      reviewLink
    );
    sendEmailToUsers(
      reviewerIds,
      `Task ready for review: ${task.title}`,
      "Task submitted for review",
      `${user.fullName} has submitted "${task.title}" for review and it's waiting for your approval.`,
      reviewLink,
      "Review task →"
    ).catch(console.error);

    return Response.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to submit for review" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Only senior devs and managers can approve/reject/reopen
    if (user.role !== "senior_developer" && user.role !== "manager") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason, reopenReason } = ReviewActionSchema.parse(body);

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return Response.json({ error: "Task not found" }, { status: 404 });

    const now = new Date();

    if (action === "approve") {
      if (task.status !== "IN_REVIEW") {
        return Response.json({ error: "Task is not in review" }, { status: 400 });
      }
      const updated = await prisma.task.update({
        where: { id },
        data: {
          status: "DONE",
          reviewStatus: "APPROVED",
          reviewedById: user.userId,
          reviewedAt: now,
          completedAt: now,
          activities: {
            create: {
              userId: user.userId,
              userFullName: user.fullName,
              action: "approved",
              details: `Approved by ${user.fullName}`,
            },
          },
        },
        include: TASK_INCLUDE,
      });
      // Activity log
      await logActivity(
        task.projectId, "task", task.id, task.title, "approved",
        { id: user.userId, name: user.fullName, role: user.role },
        `Approved "${task.title}"`
      );
      // Notify + email the assignee
      if (task.assignedToId && task.assignedToId !== user.userId) {
        const approveLink = `/projects/${task.projectId}?tab=tasks`;
        await notify(
          task.assignedToId, "task_approved", "Task approved ✅",
          `${user.fullName} approved "${task.title}". Great work!`,
          approveLink
        );
        sendEmailToUser(
          task.assignedToId,
          `Task approved: ${task.title}`,
          "Task approved ✅",
          `Great news! ${user.fullName} approved "${task.title}". The task has been marked as Done.`,
          approveLink
        ).catch(console.error);
      }
      return Response.json(updated);
    }

    if (action === "reject") {
      if (task.status !== "IN_REVIEW") {
        return Response.json({ error: "Task is not in review" }, { status: 400 });
      }
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        return Response.json(
          { error: "Rejection reason must be at least 10 characters" },
          { status: 400 }
        );
      }
      const updated = await prisma.task.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          reviewStatus: "REJECTED",
          rejectionReason: rejectionReason.trim(),
          reviewedById: user.userId,
          reviewedAt: now,
          activities: {
            create: {
              userId: user.userId,
              userFullName: user.fullName,
              action: "rejected",
              details: rejectionReason.trim().slice(0, 200),
            },
          },
        },
        include: TASK_INCLUDE,
      });
      // Activity log
      await logActivity(
        task.projectId, "task", task.id, task.title, "rejected",
        { id: user.userId, name: user.fullName, role: user.role },
        `Rejected "${task.title}": ${rejectionReason.trim().slice(0, 120)}${rejectionReason.trim().length > 120 ? "…" : ""}`
      );
      // Notify + email the assignee
      if (task.assignedToId && task.assignedToId !== user.userId) {
        const rejectLink = `/projects/${task.projectId}?tab=tasks`;
        await notify(
          task.assignedToId, "task_rejected", "Task needs revision",
          `${user.fullName} rejected "${task.title}". Please review the feedback.`,
          rejectLink
        );
        sendEmailToUser(
          task.assignedToId,
          `Task needs revision: ${task.title}`,
          "Task needs revision",
          `${user.fullName} has reviewed "${task.title}" and sent it back for changes.\n\nFeedback: ${rejectionReason.trim().slice(0, 300)}`,
          rejectLink,
          "View feedback →"
        ).catch(console.error);
      }
      return Response.json(updated);
    }

    if (action === "reopen") {
      // Manager-only: reopen a DONE task
      if (user.role !== "manager") {
        return Response.json({ error: "Only managers can reopen done tasks" }, { status: 403 });
      }
      if (task.status !== "DONE") {
        return Response.json({ error: "Task is not done" }, { status: 400 });
      }
      const updated = await prisma.task.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          reviewStatus: null,
          completedAt: null,
          reviewedById: null,
          reviewedAt: null,
          activities: {
            create: {
              userId: user.userId,
              userFullName: user.fullName,
              action: "reopened",
              details: reopenReason ?? "Reopened by manager",
            },
          },
        },
        include: TASK_INCLUDE,
      });
      // Activity log
      await logActivity(
        task.projectId, "task", task.id, task.title, "reopened",
        { id: user.userId, name: user.fullName, role: user.role },
        `Reopened "${task.title}"${reopenReason ? `: ${reopenReason}` : ""}`
      );
      // Notify the assignee
      if (task.assignedToId && task.assignedToId !== user.userId) {
        await notify(
          task.assignedToId, "task_status_changed", "Task reopened",
          `${user.fullName} reopened "${task.title}". Please continue working on it.`,
          `/projects/${task.projectId}?tab=tasks`
        );
      }
      return Response.json(updated);
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return Response.json({ error: "Failed to process review action" }, { status: 500 });
  }
}
