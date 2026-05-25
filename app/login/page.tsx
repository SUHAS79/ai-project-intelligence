"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

const DEMO_ACCOUNTS = [
  // Managers
  { role: "Manager", fullName: "Sarah Mitchell",  email: "sarah@namo.dev",  password: "manager123", color: "text-violet-400",  group: "manager" },
  { role: "Manager", fullName: "Marcus Johnson",  email: "marcus@namo.dev", password: "manager123", color: "text-violet-400",  group: "manager" },
  { role: "Manager", fullName: "Rachel Chen",     email: "rachel@namo.dev", password: "manager123", color: "text-violet-400",  group: "manager" },
  // Senior Developers
  { role: "Senior Dev", fullName: "Alex Rivera",    email: "alex@namo.dev",   password: "senior123",  color: "text-blue-400",   group: "senior" },
  { role: "Senior Dev", fullName: "Nina Volkov",    email: "nina@namo.dev",   password: "senior123",  color: "text-blue-400",   group: "senior" },
  { role: "Senior Dev", fullName: "Carlos Mendez",  email: "carlos@namo.dev", password: "senior123",  color: "text-blue-400",   group: "senior" },
  { role: "Senior Dev", fullName: "Priya Patel",    email: "priya@namo.dev",  password: "senior123",  color: "text-blue-400",   group: "senior" },
  { role: "Senior Dev", fullName: "Jordan Walsh",   email: "jordan@namo.dev", password: "senior123",  color: "text-blue-400",   group: "senior" },
  { role: "Senior Dev", fullName: "Yuki Tanaka",    email: "yuki@namo.dev",   password: "senior123",  color: "text-blue-400",   group: "senior" },
  // Developers
  { role: "Developer", fullName: "Emma Wilson",   email: "emma@namo.dev",   password: "dev123",     color: "text-emerald-400", group: "dev" },
  { role: "Developer", fullName: "James Kim",     email: "james@namo.dev",  password: "dev123",     color: "text-emerald-400", group: "dev" },
  { role: "Developer", fullName: "Maria Santos",  email: "maria@namo.dev",  password: "dev123",     color: "text-emerald-400", group: "dev" },
  { role: "Developer", fullName: "Lisa Tran",     email: "lisa@namo.dev",   password: "dev123",     color: "text-emerald-400", group: "dev" },
  { role: "Developer", fullName: "David Park",    email: "david@namo.dev",  password: "dev123",     color: "text-emerald-400", group: "dev" },
  { role: "Developer", fullName: "Sophie Brown",  email: "sophie@namo.dev", password: "dev123",     color: "text-emerald-400", group: "dev" },
  { role: "Developer", fullName: "Tyler Wright",  email: "tyler@namo.dev",  password: "dev123",     color: "text-emerald-400", group: "dev" },
  { role: "Developer", fullName: "Aisha Okafor",  email: "aisha@namo.dev",  password: "dev123",     color: "text-emerald-400", group: "dev" },
  { role: "Developer", fullName: "Ben Carter",    email: "ben@namo.dev",    password: "dev123",     color: "text-emerald-400", group: "dev" },
  { role: "Developer", fullName: "Zoe Adams",     email: "zoe@namo.dev",    password: "dev123",     color: "text-emerald-400", group: "dev" },
];

const GROUPS = [
  { key: "manager", label: "Managers",         color: "text-violet-400",  count: 3,  password: "manager123" },
  { key: "senior",  label: "Senior Developers", color: "text-blue-400",   count: 6,  password: "senior123"  },
  { key: "dev",     label: "Developers",        color: "text-emerald-400", count: 10, password: "dev123"     },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }

      const role = data.user?.role;
      if (role === "manager") {
        router.push("/");
      } else {
        router.push("/dev");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function quickFill(acc: typeof DEMO_ACCOUNTS[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(to right, #7c3aed 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-900/40 mb-4">
            <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NAMO</h1>
          <p className="text-sm text-slate-400 mt-1">Predict projects before they slip.</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-base font-semibold text-white mb-1">Sign in to your account</h2>
          <p className="text-sm text-slate-400 mb-6">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-slate-800 border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-white/[0.08] rounded-lg px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg py-2.5 px-4 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : "Sign in"}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-5 bg-slate-900/60 border border-white/[0.06] rounded-xl overflow-hidden">
          <p className="text-xs font-medium text-slate-400 px-4 pt-3.5 pb-2.5">
            Demo accounts — click any to quick-fill
          </p>

          {GROUPS.map((group) => {
            const accounts = DEMO_ACCOUNTS.filter((a) => a.group === group.key);
            const isOpen = expandedGroup === group.key;

            return (
              <div key={group.key} className="border-t border-white/[0.04]">
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => setExpandedGroup(isOpen ? null : group.key)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${group.color}`}>{group.label}</span>
                    <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded-full font-mono">
                      {group.count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 font-mono">{group.password}</span>
                    {isOpen
                      ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    }
                  </div>
                </button>

                {/* Account list */}
                {isOpen && (
                  <div className="px-3 pb-3 space-y-1">
                    {accounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => quickFill(acc)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-white/[0.04] hover:border-white/10 transition-all text-left"
                      >
                        <span className="text-xs font-medium text-white/80">{acc.fullName}</span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">{acc.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          NAMO — Neural Analytics for Management Optimization
        </p>
      </div>
    </div>
  );
}
