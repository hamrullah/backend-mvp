import { Star, ThumbsUp } from "lucide-react";

export default function AffiliateCTA() {
  return (
    <section className="relative py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] ring-1 ring-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.10)] bg-[linear-gradient(90deg,#FA056B_0%,#FF7D7F_52%,#E6BD6B_100%)]">
          <div className="grid items-center gap-6 md:grid-cols-2">
            {/* LEFT copy */}
            <div className="p-8 sm:p-10 lg:p-12 text-white">
              <h3 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                <span className="block">Start Earning with Our</span>
                <span className="block text-[#D9F35C]">Affiliate Program</span>
              </h3>
              <p className="mt-4 max-w-md text-white/90 text-sm sm:text-base">
                Partner with our voucher platform and reach more customers effortlessly.
              </p>
              <div className="mt-8">
                <a
                  href="#"
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#FA056B] shadow hover:bg-rose-50"
                >
                  Join Now
                </a>
              </div>
            </div>

            {/* RIGHT visuals */}
            <div className="relative h-full">
              {/* floating icons */}
              <div className="absolute left-[38%] -top-6 rotate-12 rounded-xl bg-white/80 p-2 shadow-lg ring-1 ring-black/5">
                <Star className="h-5 w-5 text-pink-600" />
              </div>
              <div className="absolute right-16 top-6 -rotate-6 rounded-xl bg-white/80 p-2 shadow-lg ring-1 ring-black/5">
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>

              {/* analytics mini card 1 */}
              <div className="absolute left-6 top-[-14px] rotate-[-14deg] rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
                <div className="h-24 w-32">
                  <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
                  <div className="grid grid-cols-5 gap-1">
                    {[24,28,18,32,26].map((h,i)=> (
                      <div key={i} className="bg-pink-500/70" style={{height: h, borderRadius: 3}} />
                    ))}
                  </div>
                </div>
              </div>

              {/* analytics mini card 2 */}
              <div className="absolute left-32 top-24 -rotate-3 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/5">
                <div className="h-16 w-40 rounded-xl bg-gradient-to-r from-fuchsia-500 to-amber-400" />
              </div>

              {/* person / product image */}
              <div className="relative ml-auto mr-6 flex h-full items-end justify-end">
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
                {/* Ganti /affiliate.png dengan asset kamu di /public */}
                <img
                  src="/rudi.png"
                  alt="Affiliate presenter"
                  className="relative z-10 mt-6 h-[300px] w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}