/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { Quote } from "lucide-react";
import type { CSSProperties } from "react";

/* ===== dekorasi lembaran putih di belakang ===== */
function DecoCard({
  x, y, rotate, w, h, opacity = 1,
}: { x?: number; y?: number; rotate: number; w: number; h: number; opacity?: number }) {
  const pos: CSSProperties = {
    position: "absolute",
    left: x, top: y, width: w, height: h, transform: `rotate(${rotate}deg)`,
  };
  return (
    <div style={pos} className="pointer-events-none select-none" aria-hidden>
      <div className="absolute inset-0 rounded-[12px] border border-gray-300/60 bg-white/70" />
      <div
        className="absolute inset-[22px] rounded-[8px]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0 1px, transparent 1px 12px)",
          opacity,
        }}
      />
    </div>
  );
}

/* ===== data 5 testimoni ===== */
type Testimonial = { name: string; role: string; quote: string; avatar: string };
const TESTIMONIALS: Testimonial[] = [
  { name: "John M.", role: "Daily User",  avatar: "/jhon.png",
    quote: "Buying a voucher for my new tires was incredibly straightforward. I browsed the options, purchased within minutes, and redeemed at the partner workshop without any hassle." },
  { name: "Aisha K.", role: "Member",     avatar: "/jhon.png",
    quote: "The voucher selection is great—found dining and spa deals in one place. Checkout was smooth and redemption was instant!" },
  { name: "Ridwan S.", role: "Verified Buyer", avatar: "/jhon.png",
    quote: "Value for money. Locations and terms are clear so there are no surprises when redeeming." },
  { name: "Maya P.", role: "Power User",  avatar: "/jhon.png",
    quote: "I save on every weekend activity now. The process is simple and support was responsive when I had a question." },
  { name: "Kevin L.", role: "Subscriber", avatar: "/jhon.png",
    quote: "From browsing to redeeming, everything just works. Highly recommended if you love deals that actually deliver." },
];

/* ===== kartu gelap utama ===== */
function DarkCard({ t }: { t: Testimonial }) {
  return (
    <div className="relative rounded-[14px] bg-[#2f2f2f] p-7 text-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] ring-1 ring-black/20">
      {/* folded corner */}
      <div
        aria-hidden
        className="absolute -right-1 -top-1 h-14 w-14 bg-gray-400 shadow-[0_10px_24px_rgba(0,0,0,0.18)] [clip-path:polygon(0_0,100%_0,0_100%)]"
      />
      <div className="mb-3 flex items-center gap-3">
        <Image src={t.avatar} alt={`${t.name} avatar`} width={36} height={36}
               sizes="36px" priority
               className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20" />
        <div className="text-sm font-medium">{t.name}, {t.role}</div>
      </div>
      <blockquote className="relative text-[15px] leading-relaxed text-white/90">
        <Quote className="absolute -left-2 -top-2 h-5 w-5 opacity-50" />
        <p className="pl-6">“{t.quote}”</p>
      </blockquote>
      <div className="mt-5 flex items-center gap-3 text-sm text-white/70">
        <span className="inline-block h-px w-10 bg-white/50" />
        <span>{t.name}, {t.role}</span>
      </div>
    </div>
  );
}

/* ===== section ===== */
export default function Testimonials() {
  return (
    <section className="relative overflow-hidden py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mb-8">
          <div className="text-xs text-gray-500">● Our Process</div>
          <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-gray-900">Testimonials</h2>
          <p className="mt-1 text-sm text-gray-500">
            Save more on your car essentials in just three simple steps.
          </p>
        </div>

        {/* background lembaran miring */}
        <div className="absolute inset-0 -z-10 hidden md:block">
          <DecoCard x={140} y={170} w={520} h={320} rotate={-7} opacity={0.35} />
          <DecoCard x={560} y={350} w={560} h={260} rotate={-9} opacity={0.25} />
          <DecoCard x={1000} y={190} w={460} h={300} rotate={7} opacity={0.35} />
        </div>

        {/* slider 1-karte (center) */}
        <div className="relative mx-auto w-full max-w-[680px]">
          <div
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            aria-label="User testimonials"
          >
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="w-full shrink-0 snap-center">
                <DarkCard t={t} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
