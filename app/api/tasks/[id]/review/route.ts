import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";
import { TASK_INCLUDE } from "../route";

// POST /api/tasks/[id]/review — developer submits task for review
const SubmitSchema = z.object({
  workSummary: z.string().min(1, "Work summary is required"),
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
    const { workSummary } = SubmitSchema.parse(body);

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
