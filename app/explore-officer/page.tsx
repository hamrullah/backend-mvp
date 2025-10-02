"use client";
import { useMemo, useState } from "react";
import { Search, MapPin, SlidersHorizontal, Tag, Sparkles, Heart } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AffiliateCTA from "../components/AffiliateCTA";

// --- Types ---
interface Deal {
  id: string;
  title: string;
  merchant: string;
  image: string;
  price: number;
  original?: number;
  distanceKm?: number;
  tags?: string[];
  category: string;
}

// --- Mock Data (replace with API) ---
const ALL_DEALS: Deal[] = [
  {
    id: "1",
    title: "Queen spa · Luxury Spa Escapes: Relax, Refresh, and Renew",
    merchant: "Queen Spa & Sauna",
    image: "/testing.png",
    price: 29,
    original: 52.2,
    distanceKm: 5.4,
    tags: ["Steam", "Sauna", "Bath"],
    category: "Beauty & Spa",
  },
  {
    id: "2",
    title: "Brunch Feast for 2",
    merchant: "Sunny Side Café",
    image: "/testing.png",
    price: 19,
    original: 38,
    distanceKm: 2.1,
    tags: ["Food & Drink"],
    category: "Food & Drink",
  },
  {
    id: "3",
    title: "Waterpark Day Pass",
    merchant: "SplashWorld",
    image: "/testing.png",
    price: 15,
    original: 25,
    distanceKm: 11.2,
    tags: ["Family", "Outdoor"],
    category: "Things To Do",
  },
 
];

const CATEGORIES = [
  "All",
  "Food & Drink",
  "Things To Do",
  "Beauty & Spa",
  "Gifts",
  "Travel",
  "Automobile",
  "Other",
];

function percentOff(price: number, original?: number) {
  if (!original || original <= price) return null;
  return Math.round(100 - (price / original) * 100);
}

function Banner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#E8B86C] to-[#FF7DB4] p-6 sm:p-8">
      {/* confetti-ish accents */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #fff 2px, transparent 2px), radial-gradient(circle at 80% 70%, #fff 2px, transparent 2px)",
          backgroundSize: "140px 140px",
        }}
      />
      <div className="relative">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Discover Exciting <span className="underline decoration-white/60">Promos</span>
        </h1>
        <p className="mt-2 max-w-2xl text-white/90">
          Make every day more affordable with the best promos around you.
        </p>

        {/* search */}
        <div className="mt-5 flex items-stretch gap-3">
          <div className="relative w-56">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/80" />
            <input
              className="w-full rounded-xl border border-white/20 bg-white/20 px-9 py-2 text-white placeholder:text-white/70 outline-none focus:ring-2 focus:ring-white/40"
              placeholder="Search location"
            />
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/80" />
            <input
              className="w-full rounded-xl border border-white/20 bg-white/20 px-9 py-2 text-white placeholder:text-white/70 outline-none focus:ring-2 focus:ring-white/40"
              placeholder="Search any promo you want"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-white/90">
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
      </div>
    </section>
  );
}

function Filters({
  category,
  setCategory,
  min,
  max,
  setMin,
  setMax,
}: {
  category: string;
  setCategory: (s: string) => void;
  min: string;
  max: string;
  setMin: (s: string) => void;
  setMax: (s: string) => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
              category === c
                ? "bg-gray-900 text-white"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Sparkles className="h-4 w-4" /> {c}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="col-span-2 grid grid-cols-2 gap-3">
          <div className="relative">
            <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              inputMode="decimal"
              placeholder="Min Price"
              className="w-full rounded-xl border border-gray-200 bg-white px-9 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </div>
          <div className="relative">
            <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              inputMode="decimal"
              placeholder="Max Price"
              className="w-full rounded-xl border border-gray-200 bg-white px-9 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </div>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">
          <SlidersHorizontal className="h-4 w-4" /> Advanced filters
        </button>
      </div>
    </div>
  );
}

function DealCard({ d }: { d: Deal }) {
  const pct = percentOff(d.price, d.original);
  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative">
        <img src={d.image} alt={d.title} className="h-44 w-full object-cover" />
        {pct ? (
          <div className="absolute left-3 top-3 rounded-full bg-rose-500 px-2 py-1 text-xs font-bold text-white">
            {pct}% OFF
          </div>
        ) : null}
        <button
          aria-label="Save to wishlist"
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow hover:bg-white"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3 p-4">
        <div className="text-xs text-gray-500">{d.merchant}</div>
        <h3 className="line-clamp-2 font-semibold text-gray-900">{d.title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-rose-600">RM{d.price.toFixed(2)}</span>
            {d.original ? <s className="text-xs text-gray-400">RM{d.original.toFixed(2)}</s> : null}
          </div>
          {typeof d.distanceKm === "number" && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5" /> {d.distanceKm.toFixed(1)} km
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {d.tags?.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
              {t}
            </span>
          ))}
        </div>
        <button className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-400">
          View Offer
        </button>
      </div>
    </article>
  );
}

export default function ExploreOffersPage() {
  const [category, setCategory] = useState("All");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const filtered = useMemo(() => {
    const m = parseFloat(min);
    const x = parseFloat(max);
    return ALL_DEALS.filter((d) => {
      if (category !== "All" && d.category !== category) return false;
      if (!Number.isNaN(m) && d.price < m) return false;
      if (!Number.isNaN(x) && d.price > x) return false;
      return true;
    });
  }, [category, min, max]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      {/* <Navbar  /> */}
      <main className="mx-auto max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Banner />
        <Filters category={category} setCategory={setCategory} min={min} max={max} setMin={setMin} setMax={setMax} />
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Special Voucher</h2>
            <a href="#more" className="text-sm text-rose-600 hover:underline">See more →</a>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <DealCard key={d.id} d={d} />
            ))}
          </div>
        </section>
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Things to do</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered
              .filter((d) => d.category === "Things To Do" || category !== "All")
              .map((d) => (
                <DealCard key={`t-${d.id}`} d={d} />
              ))}
          </div>
        </section>
      </main>
        <AffiliateCTA />
      <Footer />
    </div>
  );
}
