"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";

interface TaskComment {
  id: string;
  userId: string;
  userFullName: string;
  userRole: string;
  userInitials: string;
  body: string;
  createdAt: string;
}

interface TaskCommentThreadProps {
  taskId: string;
  taskTitle: string;
  currentUserId: string;
  onClose: () => void;
}

export function TaskCommentThread({
  taskId,
  taskTitle,
  currentUserId,
  onClose,
}: TaskCommentThreadProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(data.comments ?? []);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to send");
        return;
      }
      setBody("");
      await fetchComments();
    } catch {
      setError("Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg flex flex-col" style={{ maxHeight: "80vh" }}>
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquare className="w-4 h-4 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">Task Thread</h2>
            <p className="text-xs text-slate-500 truncate mt-0.5">{taskTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No comments yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Add a comment to collaborate on this task.
              </p>
            </div>
          ) : (
            comments.map((comment, i) => {
              const isMine = comment.userId === currentUserId;
              const prev = comments[i - 1];
              const isGrouped =
                prev &&
                prev.userId === comment.userId &&
                new Date(comment.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;

              return (
                <div key={comment.id} className={cn("flex gap-2.5", isMine ? "flex-row-reverse" : "flex-row")}>
                  {!isGrouped ? (
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                      isMine ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"
                    )}>
                      {comment.userInitials}
                    </div>
                  ) : (
                    <div className="w-7 shrink-0" />
                  )}

                  <div className={cn("flex flex-col max-w-[75%]", isMine ? "items-end" : "items-start")}>
                    {!isGrouped && (
                      <div className={cn("flex items-center gap-1.5 mb-0.5", isMine ? "flex-row-reverse" : "flex-row")}>
                        <span className="text-xs font-semibold text-slate-700">
                          {isMine ? "You" : comment.userFullName}
                        </span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                          ROLE_COLORS[comment.userRole] ?? "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                          {ROLE_LABELS[comment.userRole] ?? comment.userRole}
                        </span>
                      </div>
                    )}

                    <div className={cn(
                      "px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      isMine
                        ? "bg-violet-600 text-white rounded-tr-sm"
                        : "bg-slate-100 text-slate-800 rounded-tl-sm"
                    )}>
                      {comment.body}
                    </div>

                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Compose */}
        <div className="border-t border-slate-100 p-3 shrink-0">
          {error && (
            <p className="text-xs text-red-600 mb-1.5">{error}</p>
          )}
          <form onSubmit={handleSend} className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (body.trim()) handleSend(e as any);
                }
              }}
              placeholder="Add a comment… (Enter to send)"
              rows={1}
              className="flex-1 resize-none text-sm text-slate-800 placeholder:text-slate-400 border-0 outline-none bg-transparent leading-relaxed"
              style={{ maxHeight: "80px", overflowY: "auto" }}
            />
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="shrink-0 w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
