/* eslint-disable @next/next/no-img-element */

type Deal = { title: string; cta: string; img: string };

const items: Deal[] = [
  {
    title: "Delicious dining deals, just for you",
    cta: "Claim Your Dining Deal",
    img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Pamper yourself with beauty and care",
    cta: "Treat Yourself Today",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Trusted services, big savings",
    cta: "Get Service Voucher",
    img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Unforgettable journeys start here",
    cta: "Book Your Escape Now",
    img: "https://images.unsplash.com/photo-1470219556762-1771e7f9427d?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Perfect gifts for every occasion",
    cta: "Grab the Perfect Gift",
    img: "https://images.unsplash.com/photo-1549326483-579852f826f4?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Fun activities for every moment",
    cta: "Discover and Play",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
  },
];

export default function FeaturedDeals() {
  return (
    <section className="relative py-16 overflow-hidden">
      {/* radial background dari Figma (opsional) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10"
        style={{
          width: "1273px",
          height: "1273px",
          left: "-664px",
          top: "457px",
          background:
            "radial-gradient(closest-side, rgba(255,153,241,0.30) 0%, rgba(255,200,171,0.30) 38%, rgba(255,235,206,0.30) 70%, rgba(255,255,255,0) 100%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          {/* Header */}
          <div className="px-6 md:px-8 lg:px-10 pt-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
                  <span className="inline-block h-2 w-2 rounded-full bg-black" />
                  Featured Vouchers
                </div>
                <h2 className="text-[34px] md:text-[38px] font-extrabold tracking-tight">
                  <span className="text-pink-500">Today</span>{" "}
                  <span className="text-gray-800">Hot Deals</span>
                </h2>
                <p className="mt-1 text-sm text-gray-500 max-w-2xl">
                  Exclusive discounts on core essentials you don’t want to miss!
                </p>
              </div>
              <a
                href="#"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                See all vouchers <span aria-hidden>→</span>
              </a>
            </div>
          </div>

          {/* Grid */}
          <div className="px-6 md:px-8 lg:px-10 pb-12">
            <div className="grid gap-5 md:gap-6 lg:gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it, i) => (
                <article
                  key={i}
                  className="group relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <img
                    src={it.img}
                    alt=""
                    className="h-56 w-full object-cover sm:h-52 md:h-56 lg:h-48"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <h3 className="text-white text-lg font-semibold drop-shadow-sm max-w-[90%]">
                      {it.title}
                    </h3>
                    <p className="mt-2 text-white/90 text-sm underline underline-offset-4 decoration-white/60">
                      → {it.cta}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Bottom curved CTA band */}
          <div className="relative">
            <div className="relative h-36 w-full">
              <svg
                viewBox="0 0 1440 160"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#ff1270" />
                    <stop offset="100%" stopColor="#ff3c97" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,120 C240,40 480,40 720,120 C960,200 1200,200 1440,120 L1440,160 L0,160 Z"
                  fill="url(#g)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-base sm:text-lg font-semibold">
                  Join Our Program{" "}
                  <span className="ml-2 text-yellow-300 underline underline-offset-4">
                    Here
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
