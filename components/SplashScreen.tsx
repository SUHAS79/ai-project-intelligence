"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

const SESSION_KEY = "namo-splash-shown";
const HOLD_MS = 1400; // minimum on-screen time (covers Vercel cold start)
const FADE_MS = 400;

/**
 * Light, minimal branded intro shown on a fresh page load so the app never
 * flashes a blank screen during the serverless/Turso cold start. Shows once
 * per browser session and honours prefers-reduced-motion.
 *
 * Rendered identically on server and first client paint (visible) to avoid a
 * hydration mismatch; the fade is driven entirely by the effect below.
 */
export default function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const seen = sessionStorage.getItem(SESSION_KEY) === "1";
    const hold = seen ? 100 : HOLD_MS;
    sessionStorage.setItem(SESSION_KEY, "1");

    const t1 = setTimeout(() => setLeaving(true), hold);
    const t2 = setTimeout(() => setMounted(false), hold + (reduce ? 0 : FADE_MS));
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white transition-opacity duration-[400ms] ease-out ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600 mb-4">
          <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>

        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">NAMO</h1>
        <p className="text-sm text-slate-500 mt-1">Predict projects before they slip.</p>

        {/* Thin indeterminate progress bar */}
        <div className="mt-6 h-0.5 w-36 overflow-hidden rounded-full bg-slate-100">
          <div className="namo-splash-bar h-full w-1/3 rounded-full bg-violet-500" />
        </div>
      </div>

      <style>{`
        @keyframes namo-splash-slide {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(420%); }
        }
        .namo-splash-bar { animation: namo-splash-slide 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .namo-splash-bar { animation: none; width: 100%; }
        }
      `}</style>
    </div>
  );
}
