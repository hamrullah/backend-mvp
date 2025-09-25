import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

/** --- CORS --- */
const ORIGIN = "http://localhost:3001"; // origin FE kamu
const corsHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/** Helper untuk buat URL publik gambar */
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
const toPublicUrl = (p) => {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p; // sudah absolute
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${BASE_URL}${path}`;
};

function getBearer(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (h && h.toLowerCase().startsWith("bearer ")) return h.slice(7);
  return null;
}

/** GET /api/voucher/[id]  -> detail + images[] */
export async function GET(req, { params }) {
  try {
    // --- auth (optional: wajibkan bila perlu) ---
    const token = getBearer(req);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return new Response(JSON.stringify({ error: "Missing NEXTAUTH_SECRET env" }), {
        status: 500,
        headers: corsHeaders,
      });
    }
    try {
      jwt.verify(token, secret);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // --- ambil id ---
    const idParam = params?.id ?? new URL(req.url).searchParams.get("id");
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // --- query voucher ---
    // Catatan: nama model harus sesuai prisma schema kamu (mis. ms_vouchers)
    const voucher = await prisma.ms_vouchers.findUnique({
      where: { id },
      select: {
        id: true,
        code_voucher: true,
        vendor_id: true,
        category_voucher_id: true,
        title: true,
        description: true,
        inventory: true,
        price: true,
        weight: true,
        dimension: true,
        status: true,
        flag: true,
        voucher_start: true,
        voucher_end: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!voucher) {
      return new Response(JSON.stringify({ error: "Voucher not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // --- query images ---
    const rawImages = await prisma.ms_vouchers_image.findMany({
      where: { voucher_id: id },
      select: { id: true, image: true, flag: true, created_at: true, updated_at: true },
      orderBy: { created_at: "asc" },
    });

    const images = rawImages.map((img) => ({
      id: img.id,
      file: img.image,          // path di DB (mis. "/uploads/vouchers/1/xxx.jpg")
      url: toPublicUrl(img.image), // absolute URL untuk dipakai FE
      flag: img.flag,
      created_at: img.created_at,
      updated_at: img.updated_at,
    }));

    // map field agar konsisten dengan list-voucher
    const payload = {
      id: voucher.id,
      code: voucher.code_voucher,
      vendor_id: voucher.vendor_id,
      category_voucher_id: voucher.category_voucher_id,
      title: voucher.title,
      description: voucher.description,
      inventory: voucher.inventory,
      price: Number(voucher.price ?? 0),
      weight: voucher.weight != null ? Number(voucher.weight) : null,
      dimension: voucher.dimension,
      status: voucher.status,
      flag: voucher.flag,
      start: voucher.voucher_start,
      end: voucher.voucher_end,
      created_at: voucher.created_at,
      updated_at: voucher.updated_at,
      images,
    };

    return new Response(JSON.stringify({ message: "Voucher detail", voucher: payload }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
