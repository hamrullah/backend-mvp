import { Flame, MapPin, Store } from "lucide-react";

// Strong typing for each deal card
export type Deal = {
  title: string;
  category: string;
  price: string;
  oldPrice: string;
  img: string;
  discount?: string;
  distance?: string;
  shop?: string;
};

// Demo data — replace with your own/API later
export const deals: Deal[] = [
  {
    title: "RM50 Cash Voucher for Car Accessories",
    category: "Car Accessories",
    price: "RM29",
    oldPrice: "RM52.20",
    img: "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1600&auto=format&fit=crop",
    discount: "30% OFF",
    distance: "6.5 km",
    shop: "CarAccessShop",
  },
  {
    title: "Weekday Car Wash + Accessories Bundle",
    category: "Car Accessories",
    price: "RM29",
    oldPrice: "RM52.20",
    img: "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1600&auto=format&fit=crop",
    discount: "30% OFF",
    distance: "2.2 km",
    shop: "CarAccessShop",
  },
  {
    title: "RM100 Service Accessories Voucher",
    category: "Car Accessories",
    price: "RM29",
    oldPrice: "RM52.20",
    img: "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1600&auto=format&fit=crop",
    discount: "30% OFF",
    distance: "4.1 km",
    shop: "CarAccessShop",
  },
  {
    title: "All in One Car Care Voucher",
    category: "Car Accessories",
    price: "RM29",
    oldPrice: "RM52.20",
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop",
    discount: "30% OFF",
    distance: "3.4 km",
    shop: "CarAccessShop",
  },
  {
    title: "Car Lighting + Accessories Deal",
    category: "Car Accessories",
    price: "RM29",
    oldPrice: "RM52.20",
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop",
    discount: "30% OFF",
    distance: "6.5 km",
    shop: "CarAccessShop",
  },
  {
    title: "RM150 Premium Car Accessories Voucher",
    category: "Car Accessories",
    price: "RM29",
    oldPrice: "RM52.20",
    img: "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1600&auto=format&fit=crop",
    discount: "30% OFF",
    distance: "2.2 km",
    shop: "CarAccessShop",
  },
  {
    title: "Auto Detailing + Accessories Package",
    category: "Car Accessories",
    price: "RM29",
    oldPrice: "RM52.20",
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop",
    discount: "30% OFF",
    distance: "4.1 km",
    shop: "CarAccessShop",
  },
  {
    title: "RM200 Complete Car Upgrade Voucher",
    category: "Car Accessories",
    price: "RM29",
    oldPrice: "RM52.20",
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop",
    discount: "30% OFF",
    distance: "3.4 km",
    shop: "CarAccessShop",
  },
];

function DealCard({ d }: { d: Deal }) {
  return (
    <article className="group rounded-2xl bg-white ring-1 ring-black/5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Image with badge */}
      <div className="relative h-40 sm:h-44 md:h-40 lg:h-44 w-full overflow-hidden">
        <img src={d.img} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {d.discount && (
          <span className="absolute left-3 top-3 rounded-full bg-pink-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
            {d.discount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-[11px] text-gray-400">{d.category}</div>
        <h3 className="mt-1 line-clamp-2 text-[13px] font-semibold text-gray-800 min-h-[38px]">{d.title}</h3>

        {/* price */}
        <div className="mt-1 flex items-baseline gap-2">
          <div className="text-pink-600 text-[14px] font-extrabold">{d.price}</div>
          <div className="text-gray-400 text-[12px] line-through">{d.oldPrice}</div>
        </div>

        {/* meta */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-400">
          {d.distance && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {d.distance}</span>
          )}
          {d.shop && (
            <span className="inline-flex items-center gap-1"><Store className="h-3.5 w-3.5" /> {d.shop}</span>
          )}
        </div>

        {/* divider */}
        <div className="mt-3 h-[10px] rounded-full bg-gray-100">
          <div className="h-full w-1/5 rounded-full bg-pink-500/80" />
        </div>

        {/* CTA */}
        <button className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-gradient-to-r from-pink-600 to-pink-500 px-3 py-2 text-[12px] font-semibold text-white shadow hover:from-pink-700 hover:to-pink-600">
          View Offer
        </button>
      </div>
    </article>
  );
}

export default function DealsGrid() {
  return (
    <section className="relative py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-pink-600" />
            <h3 className="text-lg font-semibold text-gray-800">Hot Deals</h3>
          </div>
          <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900">See more →</a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {deals.map((d, i) => (
            <DealCard key={i} d={d} />
          ))}
        </div>
      </div>
    </section>
  );
}
