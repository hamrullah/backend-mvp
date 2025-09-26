import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

// --- CORS (reflect allow-listed origins) ---
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // e.g. https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // e.g. http://localhost:3001
  "https://frontend-mvp-phi.vercel.app",
  "http://localhost:3001",
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin") || "";
  const allow = ALLOWLIST.includes(origin) ? origin : ALLOWLIST[0] || "*";
  const h = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json",
  });
  if (allow !== "*") h.set("Access-Control-Allow-Credentials", "true");
  return h;
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: buildCors(req) });
}

// ---- helpers ----
function getToken(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (h && h.toLowerCase().startsWith("bearer ")) return h.slice(7);
  const c = req.headers.get("cookie");
  if (c) {
    const m = c.match(/(?:^|; )token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}
const asInt = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

export async function POST(req) {
  const cors = buildCors(req);
  try {
    // auth
    const token = getToken(req);
    if (!token) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    try { jwt.verify(token, process.env.NEXTAUTH_SECRET); }
    catch { return new NextResponse(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors }); }

    // require multipart/form-data
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return new NextResponse(JSON.stringify({ error: "Content-Type must be multipart/form-data" }), { status: 400, headers: cors });
    }

    const fd = await req.formData();
    const get = (k) => (fd.get(k)?.toString() ?? "").trim();

    const title = get("title");
    const vendor_id = asInt(get("vendor_id"));
    const category_voucher_id = asInt(get("category_voucher_id"));
    const inventory = asInt(get("inventory") || get("totalInventory") || 0);
    const price = money(get("price"));
    const startAt = get("startAt");
    const endAt = get("endAt");
    const description = get("description") || "";

    if (!title) return new NextResponse(JSON.stringify({ error: "Title is required" }), { status: 400, headers: cors });
    if (!vendor_id) return new NextResponse(JSON.stringify({ error: "vendor_id is required" }), { status: 400, headers: cors });

    const now = new Date();
    const voucher = await prisma.ms_vouchers.create({
      data: {
        code_voucher: `VCH-${randomUUID()}`,
        vendor_id,
        category_voucher_id,
        title,
        description,
        inventory,
        price,                // Decimal fields expect string
        weight: "0.00",
        dimension: "",
        status: 1,
        flag: 1,
        voucher_start: startAt ? new Date(startAt) : null,
        voucher_end: endAt ? new Date(endAt) : null,
        created_at: now,
        updated_at: now,
      },
      select: { id: true, title: true },
    });

    // NOTE: On Vercel, local disk isn’t persistent. Use Blob/S3 for real uploads.
    // If you already integrated file saving, make sure any error is caught and returns CORS headers.

    return new NextResponse(JSON.stringify({
      message: "Voucher created",
      voucher,
    }), { status: 201, headers: cors });

  } catch (err) {
    // Always return CORS headers on errors
    return new NextResponse(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500, headers: cors
    });
  }
}
