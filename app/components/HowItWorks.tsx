import { Search } from "lucide-react";

const steps = [
  {
    n: 1,
    title: "Browse",
    body:
      "Explore hundreds of vouchers from food, travel, beauty, services, gifts, and more — all in one place",
  },
  {
    n: 2,
    title: "Redeem",
    body:
      "Choose the voucher you like and instantly claim it with just a few taps.",
  },
  {
    n: 3,
    title: "Apply",
    body:
      "Use your voucher at the vendor’s store or online and enjoy exclusive savings.",
  },
];

function StepCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="relative">
      {/* small floating number tag (duplicated for a11y even though we show it on rail) */}
      <div className="sr-only">Step {n}</div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
        <Search className="h-6 w-6 text-gray-700" />
        <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{body}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Outer container per Figma: white, radius 30px */}
        <div className="overflow-hidden rounded-[30px] bg-white ring-1 ring-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] px-6 md:px-10 py-12">
          <header className="text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              How it works?
            </h2>
            <p className="mt-2 text-[11px] sm:text-xs text-gray-500">
              A simple way to find, claim, and enjoy vouchers
            </p>
          </header>

          {/* top rail numbers */}
          <div className="relative mx-auto mt-8 mb-6 max-w-3xl">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gray-200" />
            <div className="grid grid-cols-3 text-center text-xs font-semibold text-gray-600">
              {[1, 2, 3].map((n) => (
                <div key={n} className="relative">
                  <span className="relative z-10 inline-block rounded-full border border-gray-200 bg-white px-2.5 py-0.5 shadow-sm">
                    {n}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* steps */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {steps.map((s) => (
              <StepCard key={s.n} n={s.n} title={s.title} body={s.body} />
            ))}
          </div>
        </div>

        {/* bottom pink banner */}
        <div className="mt-8">
          <div className="relative overflow-hidden rounded-xl">
            <div className="h-20 w-full bg-gradient-to-r from-pink-600 to-pink-500" />
            {/* decorative soft right overlay */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-white/20" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-white">
                  <p className="text-sm sm:text-base font-semibold">
                    Over RM10,000 Worth of Vouchers Await You
                  </p>
                  <p className="mt-1 sm:mt-0 text-xs sm:text-sm opacity-90">
                    Discover exclusive deals and rewards across multiple categories — all in one app.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}