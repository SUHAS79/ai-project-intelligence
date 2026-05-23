"use client";

import { cn, getHealthColor, getHealthBgColor } from "@/lib/utils";

interface HealthScoreProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
  showBar?: boolean;
}

export function HealthScore({ score, label, size = "md", showBar = true }: HealthScoreProps) {
  const color = getHealthColor(score);
  const bgColor = getHealthBgColor(score);

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <div className={cn("text-lg font-bold tabular-nums", color)}>{score}</div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Health</span>
          <span className={cn("text-xs font-medium", color)}>{label}</span>
        </div>
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 251.2} 251.2`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold tabular-nums", color)}>{score}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
        </div>
        <div className="text-center">
          <div className={cn("text-sm font-semibold", color)}>{label}</div>
          <div className="text-xs text-slate-500">Project Health</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-2xl font-bold tabular-nums", color)}>{score}</span>
          <div>
            <div className="text-xs text-slate-500">/ 100</div>
            <div className={cn("text-xs font-medium", color)}>{label}</div>
          </div>
        </div>
      </div>
      {showBar && (
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", bgColor)}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}
