"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Risk } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "@/lib/insights";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { RiskModal } from "../RiskModal";
import {
  RISK_STATUS_CONFIG,
  RISK_PROBABILITY_CONFIG,
  RISK_IMPACT_CONFIG,
} from "@/lib/utils";
import { Plus, Pencil, Trash2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface RisksTabProps {
  projectId: string;
  risks: Risk[];
  insights: ProjectInsights;
}

const SEVERITY_BG: Record<string, string> = {
  CRITICAL: "bg-red-50 border-red-200",
  HIGH: "bg-orange-50 border-orange-200",
  MEDIUM: "bg-yellow-50 border-yellow-200",
  LOW: "bg-slate-50 border-slate-200",
};

function getRiskSeverity(risk: Risk): string {
  if (risk.probability === "HIGH" && risk.impact === "HIGH") return "CRITICAL";
  if (risk.probability === "HIGH" || risk.impact === "HIGH") return "HIGH";
  if (risk.probability === "MEDIUM" || risk.impact === "MEDIUM") return "MEDIUM";
  return "LOW";
}

function getSeverityColor(sev: string): string {
  const map: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700 border-red-200",
    HIGH: "bg-orange-100 text-orange-700 border-orange-200",
    MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
    LOW: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return map[sev] ?? map.LOW;
}

export function RisksTab({ projectId, risks, insights }: RisksTabProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);

  const handleCreate = async (data: any) => {
    const res = await fetch(`/api/projects/${projectId}/risks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to log risk");
    toast.success("Risk logged!");
    router.refresh();
  };

  const handleUpdate = async (data: any) => {
    if (!editingRisk) return;
    const res = await fetch(`/api/risks/${editingRisk.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update risk");
    toast.success("Risk updated!");
    setEditingRisk(null);
    router.refresh();
  };

  const handleDelete = async (riskId: string) => {
    if (!confirm("Delete this risk?")) return;
    const res = await fetch(`/api/risks/${riskId}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed to delete risk");
    toast.success("Risk deleted!");
    router.refresh();
  };

  const activeRisks = risks.filter((r) => r.status !== "RESOLVED");
  const resolvedRisks = risks.filter((r) => r.status === "RESOLVED");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Risk Register</h2>
          <p className="text-sm text-slate-500">
            {activeRisks.length} active · {resolvedRisks.length} resolved
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <Plus className="w-3.5 h-3.5" />
          Log Risk
        </Button>
      </div>

      {/* Risk Matrix Summary */}
      {insights.riskFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">AI Risk Alerts</span>
          </div>
          <ul className="space-y-1">
            {insights.riskFlags.slice(0, 3).map((flag) => (
              <li key={flag.riskId} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-0.5">•</span>
                {flag.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {risks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No risks logged</p>
          <p className="text-sm text-slate-400 mt-1">Log project risks to track and mitigate them</p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk) => {
            const severity = getRiskSeverity(risk);
            const statusCfg = RISK_STATUS_CONFIG[risk.status as keyof typeof RISK_STATUS_CONFIG];
            const probCfg = RISK_PROBABILITY_CONFIG[risk.probability as keyof typeof RISK_PROBABILITY_CONFIG];
            const impactCfg = RISK_IMPACT_CONFIG[risk.impact as keyof typeof RISK_IMPACT_CONFIG];

            return (
              <div
                key={risk.id}
                className={`bg-white rounded-xl border p-5 ${risk.status === "RESOLVED" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge className={getSeverityColor(severity)}>{severity}</Badge>
                      <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                      <h3 className="font-semibold text-slate-900">{risk.title}</h3>
                    </div>
                    {risk.description && (
                      <p className="text-sm text-slate-600 mb-2">{risk.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        Probability: <span className={`font-medium ${probCfg.color}`}>{probCfg.label}</span>
                      </span>
                      <span>
                        Impact: <span className={`font-medium ${impactCfg.color}`}>{impactCfg.label}</span>
                      </span>
                    </div>
                    {risk.mitigation && (
                      <div className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                        <span className="font-medium text-slate-700">Mitigation:</span> {risk.mitigation}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingRisk(risk)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(risk.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RiskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />
      {editingRisk && (
        <RiskModal
          isOpen={true}
          onClose={() => setEditingRisk(null)}
          onSubmit={handleUpdate}
          risk={editingRisk}
          title="Edit Risk"
        />
      )}
    </div>
  );
}
