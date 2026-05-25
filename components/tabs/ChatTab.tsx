"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageSquare, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";

interface ChatMessage {
  id: string;
  userId: string;
  userFullName: string;
  userRole: string;
  userInitials: string;
  body: string;
  createdAt: string;
}

interface ChatTabProps {
  projectId: string;
  currentUserId: string;
  currentUserRole: string;
}

export function ChatTab({ projectId, currentUserId, currentUserRole }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`);
      if (!res.ok) {
        if (res.status === 403) {
          setFetchError("You are not a member of this project's chat.");
        } else {
          setFetchError("Failed to load messages.");
        }
        return;
      }
      const data = await res.json();
      setFetchError(""); // clear any prior error on success
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      setFetchError("Network error loading messages.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load once, then poll every 5 seconds
  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSendError("");
    setSending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSendError(d.error ?? "Failed to send message.");
        return;
      }
      setBody("");
      // Fetch immediately so the sent message appears without waiting for next poll
      await fetchMessages();
    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl flex flex-col" style={{ height: "calc(100vh - 200px)", minHeight: "400px" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Project Chat</h2>
          <p className="text-xs text-slate-400">Shared thread for all project members</p>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-y-auto p-4 space-y-3 mb-3">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-24 text-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-sm text-red-600 font-medium">{fetchError}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <MessageSquare className="w-7 h-7 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400 font-medium">No messages yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Start the conversation — everyone on this project can see it.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.userId === currentUserId;
            const prevMsg = messages[i - 1];
            const isGrouped =
              prevMsg &&
              prevMsg.userId === msg.userId &&
              new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000;

            return (
              <div
                key={msg.id}
                className={cn("flex gap-2.5", isMine ? "flex-row-reverse" : "flex-row")}
              >
                {/* Avatar — only show for first in group */}
                {!isGrouped ? (
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                    isMine ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"
                  )}>
                    {msg.userInitials}
                  </div>
                ) : (
                  <div className="w-7 shrink-0" />
                )}

                <div className={cn("flex flex-col max-w-[70%]", isMine ? "items-end" : "items-start")}>
                  {/* Sender name + role — only for first in group */}
                  {!isGrouped && (
                    <div className={cn("flex items-center gap-1.5 mb-0.5", isMine ? "flex-row-reverse" : "flex-row")}>
                      <span className="text-xs font-semibold text-slate-700">
                        {isMine ? "You" : msg.userFullName}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                        ROLE_COLORS[msg.userRole] ?? "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {ROLE_LABELS[msg.userRole] ?? msg.userRole}
                      </span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn(
                    "px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                    isMine
                      ? "bg-violet-600 text-white rounded-tr-sm"
                      : "bg-slate-100 text-slate-800 rounded-tl-sm"
                  )}>
                    {msg.body}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {format(new Date(msg.createdAt), "h:mm a")}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <form onSubmit={handleSend} className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
        {sendError && (
          <p className="text-xs text-red-600 px-3 pt-2 -mb-1">{sendError}</p>
        )}
        <div className="flex items-end gap-2 p-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (body.trim() && !sending) handleSend(e as any);
              }
            }}
            placeholder="Message the team… (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={!!fetchError}
            className="flex-1 resize-none text-sm text-slate-800 placeholder:text-slate-400 border-0 outline-none bg-transparent px-2 py-1.5 leading-relaxed disabled:opacity-50"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          <button
            type="submit"
            disabled={sending || !body.trim() || !!fetchError}
            className="shrink-0 w-9 h-9 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
