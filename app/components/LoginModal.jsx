"use client";
import { useEffect, useState } from "react";

export default function LoginModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // handle non-2xx
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Login failed (${res.status})`);
      }

      const data = await res.json();
      // persist token & user (client-side)
      localStorage.setItem("auth.token", data.token);
      localStorage.setItem("auth.user", JSON.stringify(data.user));
      // notify app
      window.dispatchEvent(new Event("auth:login"));
      onClose();
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.currentTarget === e.target && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
        <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h3 className="ml-1 text-base font-semibold text-gray-900">Log In as Customer</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-5 pt-2 sm:px-6 sm:pb-6">
          <div className="text-sm text-gray-500">Welcome back</div>

          {err ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <a href="#forgot" className="text-xs font-medium text-gray-600 hover:text-gray-900">Forgot password?</a>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
