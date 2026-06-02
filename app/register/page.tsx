"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  Code2,
  Star,
  CircleUser,
  Loader2,
} from "lucide-react";
import type { SignupRole } from "@/lib/roles";

type RoleOption = {
  value: SignupRole;
  label: string;
  description: string;
  icon: typeof Crown;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "manager",
    label: "Manager",
    description: "Create projects, assign people, track delivery across the portfolio.",
    icon: Crown,
  },
  {
    value: "senior_developer",
    label: "Senior Developer",
    description: "Build, review teammates' work, and respond to escalations.",
    icon: Star,
  },
  {
    value: "developer",
    label: "Developer",
    description: "Work your assigned tasks, collaborate, and submit work for review.",
    icon: Code2,
  },
  {
    value: "other",
    label: "Other",
    description: "Just exploring or testing — get the standard contributor workspace.",
    icon: CircleUser,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — credentials
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 — role
  const [role, setRole] = useState<SignupRole | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function goToRoleStep(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setStep(2);
  }

  async function handleCreateAccount() {
    if (!role) {
      setError("Choose a role to continue.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not create your account. Please try again.");
        if (res.status === 409) setStep(1);
        return;
      }

      router.push(data.user?.role === "manager" ? "/" : "/dev");
      router.refresh();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-violet-600 mb-4">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">NAMO</h1>
          <p className="text-sm text-slate-500 mt-1">Predict projects before they slip.</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6" aria-label={`Step ${step} of 2`}>
            <StepDot index={1} step={step} label="Account" />
            <div className={`h-px flex-1 transition-colors ${step >= 2 ? "bg-violet-500" : "bg-slate-200"}`} />
            <StepDot index={2} step={step} label="Role" />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3 mb-4"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={goToRoleStep} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Create your account</h2>
                <p className="text-sm text-slate-500 mt-0.5">Use your real email — this is your login.</p>
              </div>

              <Field id="fullName" label="Full name">
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Jordan Avery"
                  className={inputClass}
                />
              </Field>

              <Field id="email" label="Email address">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </Field>

              <Field id="password" label="Create password">
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <Field id="confirm" label="Confirm password">
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className={inputClass}
                />
              </Field>

              <button type="submit" className={`${primaryBtn} mt-1`}>
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Choose your role</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  This tailors your workspace. You can change it later.
                </p>
              </div>

              <div className="space-y-2.5" role="radiogroup" aria-label="Select your role">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setRole(opt.value);
                        setError("");
                      }}
                      className={`w-full flex items-start gap-3.5 text-left rounded-xl border p-3.5 transition-colors cursor-pointer ${
                        selected
                          ? "border-violet-500 bg-violet-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                          selected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">{opt.label}</span>
                          {selected && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 shrink-0">
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {opt.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={loading || !role}
                  className={`${primaryBtn} flex-1`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-600 hover:text-violet-700 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 px-4 transition-colors cursor-pointer w-full";

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function StepDot({ index, step, label }: { index: number; step: number; label: string }) {
  const done = step > index;
  const active = step === index;
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-colors ${
          done
            ? "bg-violet-600 text-white"
            : active
            ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : index}
      </span>
      <span className={`text-xs font-medium ${active || done ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
    </div>
  );
}
