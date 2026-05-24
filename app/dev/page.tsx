import AppShell from "@/components/AppShell";
import { getUserFromToken } from "@/lib/auth";
import { LayoutDashboard, Clock, Zap, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DevDashboardPage() {
  const user = await getUserFromToken();

  return (
    <AppShell>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow shadow-violet-200">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Good to see you, {user?.fullName?.split(" ")[0] ?? "there"}.
          </h1>
        </div>
        <p className="text-sm text-slate-500 ml-9 mb-8">
          Your developer dashboard is being built in Feature 2.
        </p>

        {/* Coming soon card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center mx-auto mb-5">
            <LayoutDashboard className="w-7 h-7 text-violet-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Developer Dashboard
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Your personalized task view, ticket review workflow, and effort
            estimation tools are coming in the next feature sprint.
          </p>

          {/* What's coming */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left">
            {[
              { label: "Feature 2", desc: "Your tasks & daily view" },
              { label: "Feature 3", desc: "Ticket review workflow" },
              { label: "Feature 4", desc: "Effort estimation" },
            ].map((f) => (
              <div
                key={f.label}
                className="bg-slate-50 border border-slate-100 rounded-xl p-3"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-600">
                    {f.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile shortcut */}
        <div className="mt-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <a
            href="/profile"
            className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {user?.initials ?? "?"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {user?.fullName}
                </p>
                <p className="text-xs text-slate-400">
                  View profile & change password
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </div>
    </AppShell>
  );
}
