"use client";
import { useState } from "react";
import { Menu, X, LogIn, UserPlus } from "lucide-react";


export default function Navbar() {
const [open, setOpen] = useState(false);
return (
<header className="sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100">
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<div className="flex h-16 items-center justify-between">
<div className="flex items-center gap-3">
<span className="font-semibold tracking-wide">ALIMAS</span>
</div>


<nav className="hidden md:flex items-center gap-8 text-sm">
<a className="hover:text-gray-900 text-gray-600" href="#">Home</a>
<a className="hover:text-gray-900 text-gray-600" href="#offers">Explore Offers</a>
<a className="hover:text-gray-900 text-gray-600" href="#vendors">Vendor Membership</a>
<a className="hover:text-gray-900 text-gray-600" href="#affiliate">Affiliate Program</a>
<a className="hover:text-gray-900 text-gray-600" href="#blog">Blog/News</a>
<a className="hover:text-gray-900 text-gray-600" href="#about">About Us</a>
<a className="hover:text-gray-900 text-gray-600" href="#contact">Contact Us</a>
</nav>


<div className="hidden md:flex items-center gap-3">
<button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">
<LogIn className="h-4 w-4" /> Log In
</button>
<button className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-amber-300">
<UserPlus className="h-4 w-4" /> Sign Up
</button>
</div>


<button className="md:hidden p-2" onClick={() => setOpen((v) => !v)} aria-label="Toggle Menu">
{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
</button>
</div>
</div>


{open && (
<div className="md:hidden border-t border-gray-100">
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 grid gap-3 text-sm">
{["Home","Explore Offers","Vendor Membership","Affiliate Program","Blog/News","About Us","Contact Us"].map((item) => (
<a key={item} href="#" className="text-gray-700 hover:text-gray-900">{item}</a>
))}
<div className="flex gap-3 pt-2">
<button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 font-medium hover:bg-gray-50">
<LogIn className="h-4 w-4" /> Log In
</button>
<button className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-semibold text-gray-900 shadow-sm hover:bg-amber-300">
<UserPlus className="h-4 w-4" /> Sign Up
</button>
</div>
</div>
</div>
)}
</header>
);
}