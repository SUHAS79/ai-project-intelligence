/** Client-safe role constants and types — no server imports here. */

export type TokenPayload = {
  userId: string;
  email: string;
  role: string;
  fullName: string;
  initials: string;
};

export const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  developer: "Developer",
  senior_developer: "Senior Developer",
};

export const ROLE_COLORS: Record<string, string> = {
  manager: "bg-violet-100 text-violet-700 border-violet-200",
  developer: "bg-emerald-100 text-emerald-700 border-emerald-200",
  senior_developer: "bg-blue-100 text-blue-700 border-blue-200",
};

export function computeInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
