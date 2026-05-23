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
  cn,
} from "@/lib/utils";
import { Plus, Pencil, Trash2, ShieldAlert, Brain } from "lucide-react";
import { toast } from "sonner";

interface RisksTabProps {
  projectId: string;
  risks: Risk[];
  insights: ProjectInsights;
}

function getRiskSeverity(risk: Risk): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  if (risk.probability === "HIGH" && risk.impact === "HIGH") return "CRITICAL";
  if (risk.probability === "HIGH" || risk.impact === "HIGH") return "HIGH";
  if (risk.probability === "MEDIUM" || risk.impact === "MEDIUM") return "MEDIUM";
  return "LOW";
}

const SEV_STYLES = {
  CRITICAL: { badge: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", bar: "border-l-red-400" },
  HIGH:     { badge: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400", bar: "border-l-orange-400" },
  MEDIUM:   { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400", bar: "border-l-amber-300" },
  LOW:      { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-300", bar: "border-l-slate-300" },
};

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
    toast.success("Risk logged");
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
    toast.success("Risk updated");
    setEditingRisk(null);
    router.refresh();
  };

  const handleDelete = async (riskId: string) => {
    if (!confirm("Delete this risk? This cannot be undone.")) return;
    const res = await fetch(`/api/risks/${riskId}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed to delete risk");
    toast.success("Risk deleted");
    router.refresh();
  };

  const activeRisks = risks.filter((r) => r.status !== "RESOLVED").sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[getRiskSeverity(a)] - order[getRiskSeverity(b)];
  });
  const resolvedRisks = risks.filter((r) => r.status === "RESOLVED");

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Risk Register</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeRisks.length} active · {resolvedRisks.length} resolved
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <Plus className="w-3.5 h-3.5" />
          Log Risk
        </Button>
      </div>

      {/* AI Risk Alerts */}
      {insights.riskFlags.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-sm font-semibold text-slate-900">NAMO Risk Analysis</span>
            <span className="ml-auto text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
              {insights.riskFlags.length} alert{insights.riskFlags.length !== 1 ? "s" : ""}
            </span>
          </div>
          <ul className="space-y-2">
            {insights.riskFlags.map((flag) => {
              const sev = flag.severity as keyof typeof SEV_STYLES;
              const style = SEV_STYLES[sev] ?? SEV_STYLES.LOW;
              return (
                <li key={flag.riskId} className="flex items-start gap-2.5 text-sm">
                  <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", style.dot)} />
                  <span className="text-slate-600">{flag.message}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {risks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No risks logged</p>
          <p className="text-sm text-slate-400">Track project risks to stay ahead of problems</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active risks */}
          {activeRisks.map((risk) => {
            const severity = getRiskSeverity(risk);
            const sty = SEV_STYLES[severity];
            const statusCfg = RISK_STATUS_CONFIG[risk.status as keyof typeof RISK_STATUS_CONFIG];
            const probCfg = RISK_PROBABILITY_CONFIG[risk.probability as keyof typeof RISK_PROBABILITY_CONFIG];
            const impactCfg = RISK_IMPACT_CONFIG[risk.impact as keyof typeof RISK_IMPACT_CONFIG];

            return (
              <div
                key={risk.id}
                className={cn(
                  "bg-white rounded-xl border border-l-4 border-slate-200/80 shadow-sm p-4 group",
                  sty.bar
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={sty.badge}>{severity}</Badge>
                      <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                      <span className="font-semibold text-slate-900 text-sm">{risk.title}</span>
                    </div>
                    {risk.description && (
                      <p className="text-sm text-slate-500 mb-2 leading-relaxed">{risk.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>
                        Probability:{" "}
                        <span className={cn("font-semibold", probCfg.color)}>{probCfg.label}</span>
                      </span>
                      <span>
                        Impact:{" "}
                        <span className={cn("font-semibold", impactCfg.color)}>{impactCfg.label}</span>
                      </span>
                    </div>
                    {risk.mitigation && (
                      <div className="mt-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <span className="font-medium text-slate-700">Mitigation plan:</span>{" "}
                        {risk.mitigation}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingRisk(risk)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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

          {/* Resolved risks (collapsed/dimmed) */}
          {resolvedRisks.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 px-1">
                Resolved ({resolvedRisks.length})
              </div>
              <div className="space-y-2">
                {resolvedRisks.map((risk) => {
                  const severity = getRiskSeverity(risk);
                  const sty = SEV_STYLES[severity];
                  return (
                    <div
                      key={risk.id}
                      className="bg-white rounded-xl border border-slate-100 p-4 opacity-50 group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Badge className={sty.badge}>{severity}</Badge>
                          <span className="text-sm font-medium text-slate-700 line-through">{risk.title}</span>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingRisk(risk)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
            </div>
          )}
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
