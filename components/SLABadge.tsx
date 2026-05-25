"use client";

import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SLALevel = "ok" | "warning" | "overdue";

interface SLAConfig {
  warnAfterHours: number;  // show warning after this many hours
  overdueAfterHours: number; // show overdue after this many hours
}

const SLA_CONFIGS = {
  review: { warnAfterHours: 24, overdueAfterHours: 72 },
  escalation: { warnAfterHours: 4, overdueAfterHours: 24 },
} as const;

function getElapsedHours(since: string | Date): number {
  const start = typeof since === "string" ? new Date(since) : since;
  return (Date.now() - start.getTime()) / (1000 * 60 * 60);
}

function formatElapsed(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  if (hours < 24) {
    return `${Math.floor(hours)}h`;
  }
  const days = Math.floor(hours / 24);
  const remHours = Math.floor(hours % 24);
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

function getSLALevel(hours: number, config: SLAConfig): SLALevel {
  if (hours >= config.overdueAfterHours) return "overdue";
  if (hours >= config.warnAfterHours) return "warning";
  return "ok";
}

const LEVEL_STYLES: Record<SLALevel, string> = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
};

const LEVEL_ICON: Record<SLALevel, typeof Clock> = {
  ok: CheckCircle2,
  warning: Clock,
  overdue: AlertTriangle,
};

interface SLABadgeProps {
  since: string | Date;
  type: keyof typeof SLA_CONFIGS;
  /** Optional extra className on the badge wrapper */
  className?: string;
  /** Show a label prefix, e.g. "Waiting" or "Open" */
  label?: string;
}

/**
 * Displays elapsed time since `since` with urgency colouring:
 *   - review:     OK < 24h · Warning 24–72h · Overdue > 72h
 *   - escalation: OK < 4h  · Warning 4–24h  · Overdue > 24h
 */
export function SLABadge({ since, type, className, label }: SLABadgeProps) {
  const hours = getElapsedHours(since);
  const level = getSLALevel(hours, SLA_CONFIGS[type]);
  const Icon = LEVEL_ICON[level];
  const elapsed = formatElapsed(hours);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full border",
        LEVEL_STYLES[level],
        className
      )}
      title={`${label ?? "Waiting"} ${elapsed} (${level})`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {label ? `${label} ${elapsed}` : elapsed}
    </span>
  );
}
