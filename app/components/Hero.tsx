/* eslint-disable @next/next/no-img-element */
import { Poppins, Pacifico } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["800", "900"] });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* kurva putih besar di kanan */}
      <svg
        className="pointer-events-none absolute right-0 top-16 h-[560px] w-[720px]"
        viewBox="0 0 720 560"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M720,30 L720,560 L330,560 C270,455 350,410 470,350 C590,290 560,210 565,170 C570,120 640,75 720,30 Z"
          fill="#f5f6f7"
        />
      </svg>

      {/* gradasi lembut kiri-bawah */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[-140px] h-[320px] bg-[radial-gradient(120%_80%_at_10%_100%,rgba(255,160,180,0.2),rgba(255,220,170,0.18),transparent_70%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* spacing seperti figma (bukan full-screen) */}
        <div className="grid items-center gap-10 pt-16 pb-8 lg:grid-cols-2">
          {/* LEFT copy */}
          <div className="pt-10">
            {/* aksen kecil */}
            <span className="relative -left-6 -top-6 inline-block h-6 w-6 rotate-12 rounded-sm bg-rose-400" />
            <h1
              className={`${poppins.className} text-[44px] sm:text-[48px] lg:text-[56px] leading-tight font-extrabold tracking-tight text-gray-900 drop-shadow-title`}
            >
              <span className="block">More Than Discount</span>
              <span className="mt-2 block">
                it’s a{" "}
                <span className="relative inline-block align-baseline">
                  {/* glow di belakang kata script */}
                  <span className="absolute inset-0 -z-[1] rounded-md opacity-45 blur-[10px] bg-gradient-to-r from-[#ff44b6] via-[#ff87a1] to-[#ffb347]" />
                  <span
                    className={`${pacifico.className} bg-gradient-to-r from-[#ff44b6] via-[#ff87a1] to-[#ffb347] bg-clip-text text-transparent text-[64px] leading-none`}
                  >
                    Lifestyle
                  </span>
                </span>
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-[15px] text-gray-500">
              Thousands are already enjoying exclusive vouchers — don’t miss out on the perks.
            </p>

            {/* CTA pill putih ber-border */}
            <div className="mt-8 flex items-center gap-6">
              <a
                href="#join"
                className="inline-flex items-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:bg-gray-50"
              >
                Join Now &amp; Save More
              </a>
              <a href="#how" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                How it works
              </a>
            </div>
          </div>

          {/* RIGHT image + aksen */}
          <div className="relative">
            <span className="absolute left-[44%] -top-8 block h-5 w-5 rotate-45 bg-[#eab308]" />
            <div className="relative ml-auto w-full max-w-[640px]">
                <img
                  src="/MaskGroup.png"
                  alt="Happy shopper using phone with colorful bags"
                  className="h-[520px] w-full object-cover"
                />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
