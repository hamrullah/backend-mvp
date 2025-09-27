// components/CategoriesBoard.tsx
import {
  Megaphone, Utensils, Sparkles, Flower2, Gift, Plane, Car,
  Monitor, Home, ShoppingBag, Gem, Dumbbell, CalendarDays, Palette
} from "lucide-react";
import type { LucideIcon } from "lucide-react";   // ⬅️ tambahkan

type CategoryItem = {
  label: string;
  Icon: LucideIcon;   // ⬅️ ganti any -> LucideIcon
  color: string;
};

const row1: CategoryItem[] = [
  { label: "Special", Icon: Megaphone, color: "text-yellow-500" },
  { label: "Food & Drink", Icon: Utensils, color: "text-rose-500" },
  { label: "Things To Do", Icon: Sparkles, color: "text-cyan-500" },
  { label: "Beauty & Spa", Icon: Flower2, color: "text-purple-500" },
  { label: "Gifts", Icon: Gift, color: "text-green-500" },
  { label: "Travel", Icon: Plane, color: "text-sky-500" },
  { label: "AutoMobile", Icon: Car, color: "text-amber-500" },
];

const row2: CategoryItem[] = [
  { label: "Electronic", Icon: Monitor, color: "text-emerald-500" },
  { label: "Home Living", Icon: Home, color: "text-orange-500" },
  { label: "Fashion", Icon: ShoppingBag, color: "text-pink-500" },
  { label: "Accessories", Icon: Gem, color: "text-indigo-500" },
  { label: "Sports", Icon: Dumbbell, color: "text-blue-600" },
  { label: "Events", Icon: CalendarDays, color: "text-fuchsia-500" },
  { label: "Hobbies", Icon: Palette, color: "text-red-500" },
];

function Row({ items }: { items: CategoryItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-y-8">
      {items.map(({ label, Icon, color }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} strokeWidth={2.6} />
          <div className="text-[13px] text-gray-700">{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function CategoriesBoard() {
  return (
    <section className="relative py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5 px-6 md:px-8 lg:px-10 py-10">
          <Row items={row1} />
          <hr className="my-8 border-t border-gray-200" />
          <Row items={row2} />
        </div>
      </div>
    </section>
  );
}
