"use client";
import { useEffect, useState } from "react";
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

export default function Navbar({ onOpenLogin, onOpenSignup }: { onOpenLogin: () => void; onOpenSignup: () => void; }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  // hydrate user from localStorage
  useEffect(() => {
    const load = () => {
      try {
        const u = localStorage.getItem("auth.user");
        setUser(u ? JSON.parse(u) : null);
      } catch { setUser(null); }
    };
    load();
    window.addEventListener("auth:login", load);
    window.addEventListener("auth:logout", load);
    return () => {
      window.removeEventListener("auth:login", load);
      window.removeEventListener("auth:logout", load);
    };
  }, []);

  function logout() {
    localStorage.removeItem("auth.token");
    localStorage.removeItem("auth.user");
    window.dispatchEvent(new Event("auth:logout"));
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide">ALIMAS</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link className="hover:text-gray-900 text-gray-600" href="/">Home</Link>
            <Link className="hover:text-gray-900 text-gray-600" href="/explore-officer">Explore Offers</Link>
            <a className="hover:text-gray-900 text-gray-600" href="#vendors">Vendor Membership</a>
            <a className="hover:text-gray-900 text-gray-600" href="#affiliate">Affiliate Program</a>
            <a className="hover:text-gray-900 text-gray-600" href="#blog">Blog/News</a>
            <a className="hover:text-gray-900 text-gray-600" href="#about">About Us</a>
            <a className="hover:text-gray-900 text-gray-600" href="#contact">Contact Us</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-700">Hi, <b></b></span>
                <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={onOpenLogin} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                  <LogIn className="h-4 w-4" /> Log In
                </button>
                <button onClick={onOpenSignup} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-amber-300">
                  <UserPlus className="h-4 w-4" /> Sign Up
                </button>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setOpen((v) => !v)} aria-label="Toggle Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {/* (menu mobile—boleh disesuaikan sama logic user seperti di atas) */}
    </header>
  );
}
