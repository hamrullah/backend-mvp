import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

/** ---------- CORS (Allowlist) ---------- */
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // ex: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // ex: http://localhost:3001
  "https://frontend-mvp-phi.vercel.app",
  "http://localhost:3001",
].filter(Boolean);

function buildCors(req) {
  const reqOrigin = req.headers.get("origin") || "";
  const allow = ALLOWLIST.includes(reqOrigin) ? reqOrigin : ALLOWLIST[0] || "*";
  const h = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });
  if (allow !== "*") h.set("Access-Control-Allow-Credentials", "true");
  return h;
}

export async function OPTIONS(req) {
  return new Response(null, { status: 204, headers: buildCors(req) });
}

/** Helper URL publik gambar */
function baseUrlFromEnvOrReq(req) {
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (envBase) return envBase;
  // fallback ke origin backend (aman untuk path /uploads yang diserve dari public)
  return new URL(req.url).origin;
}
const toPublicUrl = (p, base) => {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p; // sudah absolute
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${base}${path}`;
};

function getBearer(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (h && h.toLowerCase().startsWith("bearer ")) return h.slice(7);
  return null;
}

/** ---------- GET /api/voucher/[id] -> detail + images[] ---------- */
export async function GET(req, { params }) {
  const cors = buildCors(req);
  try {
    // --- auth (sesuaikan kalau mau public) ---
    const token = getBearer(req);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: cors,
      });
    }
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return new Response(JSON.stringify({ error: "Missing NEXTAUTH_SECRET env" }), {
        status: 500,
        headers: cors,
      });
    }
    try {
      jwt.verify(token, secret);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: cors,
      });
    }

    // --- ambil id ---
    const idParam = params?.id ?? new URL(req.url).searchParams.get("id");
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
        headers: cors,
      });
    }

    // --- query voucher ---
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
        headers: cors,
      });
    }

    // --- query images ---
    const rawImages = await prisma.ms_vouchers_image.findMany({
      where: { voucher_id: id },
      select: { id: true, image: true, flag: true, created_at: true, updated_at: true },
      orderBy: { created_at: "asc" },
    });

    const base = baseUrlFromEnvOrReq(req);
    const images = rawImages.map((img) => ({
      id: img.id,
      file: img.image,                 // path di DB (mis. "/uploads/vouchers/xxx.jpg")
      url: toPublicUrl(img.image, base), // absolute URL untuk FE
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
      price: voucher.price != null ? Number(voucher.price) : 0,
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
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500,
      headers: cors,
    });
  }
}
