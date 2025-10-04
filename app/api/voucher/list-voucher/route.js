// app/api/voucher/list-voucher/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// ===== CORS: reflect allowlist =====
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // ex: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // ex: http://localhost:3001
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin");
  const allow = ALLOWLIST.includes(origin) ? origin : (ALLOWLIST[0] || "*");
  const headers = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json",
  });
  if (allow !== "*") headers.set("Access-Control-Allow-Credentials", "true");
  return headers;
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: buildCors(req) });
}

// ---- helpers ----
function getToken(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (h && h.toLowerCase().startsWith("bearer ")) return h.slice(7);
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const m = cookie.match(/(?:^|; )token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

function labelToWhere(label, now) {
  const L = (label || "").toLowerCase();
  switch (L) {
    case "archived":
      return { OR: [{ flag: 0 }, { voucher_end: { lt: now } }] };
    case "unlisted":
      return {
        status: 0,
        flag: { not: 0 },
        OR: [{ voucher_end: null }, { voucher_end: { gte: now } }],
      };
    case "scheduled":
      return { status: 1, flag: { not: 0 }, voucher_start: { gt: now } };
    case "published":
      return {
        status: 1,
        flag: { not: 0 },
        voucher_start: { lte: now },
        OR: [{ voucher_end: null }, { voucher_end: { gte: now } }],
      };
    default:
      return {};
  }
}

export async function GET(req) {
  const cors = buildCors(req);
  try {
    // --- auth ---
    const token = getToken(req);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: cors,
      });
    }
    try {
      jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: cors,
      });
    }

    // --- query params ---
    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));
    const q = (url.searchParams.get("q") || "").trim();
    const statusLabel = url.searchParams.get("status"); // Published|Scheduled|Unlisted|Archived
    const vendorId = url.searchParams.get("vendor_id"); // optional

    const now = new Date();
    const AND = [];
    if (q) {
      AND.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { code_voucher: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    if (vendorId) AND.push({ vendor_id: Number(vendorId) });
    if (statusLabel) AND.push(labelToWhere(statusLabel, now));
    const where = AND.length ? { AND } : undefined;

    // ⚠️ Pastikan nama model sesuai schema:
    // - Jika model-nya `model ms_vouchers` -> prisma.ms_vouchers
    // - Jika `model Voucher @@map("ms_vouchers")` -> prisma.voucher
    const model = prisma.ms_vouchers;

    const [rows, total] = await Promise.all([
      model.findMany({
        where,
        orderBy: { voucher_start: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          code_voucher: true,
          title: true,
          description: true,
          vendor_id: true,
          category_voucher_id: true,
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
      }),
      model.count({ where }),
    ]);

    const vouchers = rows.map((v) => {
      const price = v.price != null ? Number(v.price) : null;
      const weight = v.weight != null ? Number(v.weight) : null;
      const status_label =
        v.flag === 0 || (v.voucher_end && v.voucher_end < now)
          ? "Archived"
          : v.status === 0
          ? "Unlisted"
          : v.voucher_start && v.voucher_start > now
          ? "Scheduled"
          : "Published";

      return {
        id: v.id,
        code: v.code_voucher,
        title: v.title,
        description: v.description,
        vendor_id: v.vendor_id,
        category_voucher_id: v.category_voucher_id,
        inventory: v.inventory,
        price,
        weight,
        dimension: v.dimension,
        status: v.status,
        flag: v.flag,
        start: v.voucher_start,
        end: v.voucher_end,
        created_at: v.created_at,
        updated_at: v.updated_at,
        status_label,
      };
    });

    return NextResponse.json(
      {
        message: "Voucher list",
        pagination: { total, limit, offset },
        vouchers,
      },
      { headers: cors }
    );
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500,
      headers: cors,
    });
  }
}
