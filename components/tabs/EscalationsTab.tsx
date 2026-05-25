"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { EscalationsSection } from "../EscalationsSection";
import { EscalateModal } from "../EscalateModal";

interface EscalationsFull {
  id: string;
  message: string;
  status: string;
  targetRole: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  project: { id: string; name: string };
  task: { id: string; title: string; status: string; priority: string } | null;
  createdBy: { id: string; fullName: string; initials: string; role: string };
  respondedBy: { id: string; fullName: string; initials: string } | null;
}

interface EscalationsTabProps {
  projectId: string;
  projectName: string;
  currentUserId: string;
  currentUserRole: string;
  isManager: boolean;
}

export function EscalationsTab({
  projectId,
  projectName,
  currentUserId,
  currentUserRole,
  isManager,
}: EscalationsTabProps) {
  const [escalations, setEscalations] = useState<EscalationsFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const fetchEscalations = useCallback(async () => {
    try {
      const res = await fetch("/api/escalations");
      if (!res.ok) return;
      const data = await res.json();
      // API returns array directly; filter to this project
      const all: EscalationsFull[] = Array.isArray(data) ? data : [];
      setEscalations(all.filter((e) => e.project.id === projectId));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEscalations();
  }, [fetchEscalations]);

  const canEscalate = currentUserRole === "developer" || currentUserRole === "senior_developer";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            Escalations
            <span className="ml-2 text-slate-400 font-normal">
              {escalations.length} total
            </span>
            {escalations.filter((e) => e.status === "OPEN").length > 0 && (
              <span className="ml-2 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                {escalations.filter((e) => e.status === "OPEN").length} open
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Escalations raised by and for this project's team.
          </p>
        </div>
        {canEscalate && (
          <button
            onClick={() => setShowEscalateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            New Escalation
          </button>
        )}
      </div>

      <EscalationsSection
        escalations={escalations}
        userRole={currentUserRole}
        userId={currentUserId}
        title=""
        emptyMessage="No escalations for this project yet."
      />

      {showEscalateModal && (
        <EscalateModal
          project={{ id: projectId, name: projectName }}
          userRole={currentUserRole}
          onClose={() => setShowEscalateModal(false)}
          onSuccess={() => {
            setShowEscalateModal(false);
            fetchEscalations();
          }}
        />
      )}
    </div>
  );
}
