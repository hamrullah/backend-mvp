"use client";
import { useEffect, useState } from "react";

export default function SignUpModal({ open, onClose }) {
  const [showPwd, setShowPwd] = useState(false);

  // ESC untuk close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Kunci scroll saat modal terbuka
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open]);

  if (!open) return null;

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
          <h3 className="ml-1 text-base font-semibold text-gray-900">Create your account</h3>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: ganti dengan sign-up API (NextAuth credentials/Firebase/Supabase)
            alert("Signed up (demo)");
            onClose();
          }}
          className="space-y-4 px-4 pb-5 pt-2 sm:px-6 sm:pb-6"
        >
          <div className="grid gap-3">
            <div className="space-y-2">
              <label htmlFor="su-name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="su-name"
                type="text"
                required
                placeholder="Jane Doe"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="su-email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="su-email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="su-password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  id="su-password"
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="min. 8 characters"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500 hover:text-gray-800"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-gray-500">Use 8+ chars with letters & numbers.</p>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input required type="checkbox" className="h-4 w-4 rounded border-gray-300" />
              I agree to the <a className="underline hover:text-gray-900" href="#terms">Terms</a> & <a className="underline hover:text-gray-900" href="#privacy">Privacy</a>
            </label>
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-amber-300"
          >
            Create account
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account? <a href="#login" className="font-semibold hover:text-gray-900">Log In</a>
          </p>
        </form>
      </div>
    </div>
  );
}
