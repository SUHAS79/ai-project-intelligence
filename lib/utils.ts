import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_CONFIG = {
  TODO: { label: "To Do", color: "bg-slate-100 text-slate-700 border-slate-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  BLOCKED: { label: "Blocked", color: "bg-red-100 text-red-700 border-red-200" },
  DONE: { label: "Done", color: "bg-green-100 text-green-700 border-green-200" },
} as const;

export const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "bg-slate-100 text-slate-600 border-slate-200" },
  MEDIUM: { label: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200" },
  CRITICAL: { label: "Critical", color: "bg-red-100 text-red-700 border-red-200" },
} as const;

export const RISK_PROBABILITY_CONFIG = {
  LOW: { label: "Low", color: "text-green-600" },
  MEDIUM: { label: "Medium", color: "text-yellow-600" },
  HIGH: { label: "High", color: "text-red-600" },
} as const;

export const RISK_IMPACT_CONFIG = {
  LOW: { label: "Low", color: "text-green-600" },
  MEDIUM: { label: "Medium", color: "text-yellow-600" },
  HIGH: { label: "High", color: "text-red-600" },
} as const;

export const RISK_STATUS_CONFIG = {
  OPEN: { label: "Open", color: "bg-red-100 text-red-700 border-red-200" },
  MITIGATING: { label: "Mitigating", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-700 border-green-200" },
  ACCEPTED: { label: "Accepted", color: "bg-slate-100 text-slate-700 border-slate-200" },
} as const;

export const PROJECT_STATUS_CONFIG = {
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700 border-green-200" },
  ON_HOLD: { label: "On Hold", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700 border-blue-200" },
  CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-700 border-slate-200" },
} as const;

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysFromNow(date: Date | string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getHealthColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}

export function getHealthBgColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}
