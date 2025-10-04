// app/api/voucher/list-voucher/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_ORIGIN_LOCAL,
  "https://frontend-mvp-phi.vercel.app",
  "http://localhost:3001",
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin") || "";
  const allow = ALLOWLIST.includes(origin) ? origin : ALLOWLIST[0] || "*";
  const h = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Content-Type": "application/json",
  });
  if (allow !== "*") h.set("Access-Control-Allow-Credentials", "true");
  return h;
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: buildCors(req) });
}

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

const HAS_MONTHLY_LIMIT = process.env.HAS_MONTHLY_LIMIT === "1";
const toInt = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : d;
};

export async function GET(req) {
  const cors = buildCors(req);
  try {
    // --- auth (opsional: kamu bisa matikan kalau memang publik)
    const token = getToken(req);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }
    try {
      jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, toInt(searchParams.get("limit") ?? 10, 10));
    const offset = Math.max(0, toInt(searchParams.get("offset") ?? 0, 0));
    const q = (searchParams.get("q") || "").trim();
    const sortBy = (searchParams.get("sortBy") || "voucher_start");
    const sortDir = (searchParams.get("sortDir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

    // --- where (tanpa undefined)
    const where = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { code_voucher: { contains: q, mode: "insensitive" } },
      ];
    }

    // --- select (guard monthly_usage_limit)
    const select = {
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
    };
    if (HAS_MONTHLY_LIMIT) {
      // hanya dipakai kalau schema & client sudah punya kolom ini
      select.monthly_usage_limit = true;
    }

    // --- orderBy aman (fallback ke voucher_start)
    const allowedSort = new Set([
      "voucher_start", "voucher_end", "created_at", "updated_at", "price", "inventory", "title"
    ]);
    const orderByField = allowedSort.has(sortBy) ? sortBy : "voucher_start";
    const orderBy = { [orderByField]: sortDir };

    // --- query
    const [rows, total] = await Promise.all([
      prisma.ms_vouchers.findMany({
        where: Object.keys(where).length ? where : undefined,
        orderBy,
        skip: offset,
        take: limit,
        select,
      }),
      prisma.ms_vouchers.count({
        where: Object.keys(where).length ? where : undefined,
      }),
    ]);

    // mapping field agar cocok FE (start/end)
    const vouchers = rows.map((v) => ({
      id: v.id,
      code: v.code_voucher,
      title: v.title,
      description: v.description,
      vendor_id: v.vendor_id,
      category_voucher_id: v.category_voucher_id,
      inventory: Number(v.inventory),
      price: Number(v.price), // Decimal -> number
      weight: v.weight != null ? Number(v.weight) : null,
      dimension: v.dimension,
      status: v.status,
      flag: v.flag,
      start: v.voucher_start,
      end: v.voucher_end,
      created_at: v.created_at,
      updated_at: v.updated_at,
      ...(HAS_MONTHLY_LIMIT ? { monthly_usage_limit: v.monthly_usage_limit ?? null } : {}),
    }));

    return new NextResponse(
      JSON.stringify({
        message: "Voucher list",
        pagination: { total, limit, offset },
        vouchers,
      }),
      { status: 200, headers: cors }
    );
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: cors,
    });
  }
}
