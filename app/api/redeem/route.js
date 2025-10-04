// app/api/redeem/list/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
export const runtime = 'nodejs';
/* ---------- CORS ---------- */
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_ORIGIN_LOCAL,
  "http://localhost:3001",
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin") || "";
  const allow = ALLOWLIST.includes(origin) ? origin : (ALLOWLIST[0] || "*");
  const h = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
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

/* ---------- Helpers ---------- */
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

function parseUser(payload) {
  const userId =
    Number(payload?.id) ||
    Number(payload?.userId) ||
    Number(payload?.uid) ||
    Number(payload?.sub);
  const roleName = String(
    payload?.role || payload?.role_name || payload?.roleName || ""
  ).toLowerCase();
  const roleId = Number(payload?.role_id ?? payload?.roleId);
  const isAdmin = roleName === "admin" || roleId === 4; // sesuaikan mapping
  return { userId, isAdmin };
}

const asInt = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : d;
};

/* ---------- GET /api/redeem/list ---------- */
export async function GET(req) {
  const cors = buildCors(req);
  try {
    // auth
    const token = getToken(req);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
    }
    const { userId, isAdmin } = parseUser(payload);
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Invalid token payload" }), { status: 401, headers: cors });
    }

    // query params
    const url = new URL(req.url);
    const limit  = Math.min(50, Math.max(1, asInt(url.searchParams.get("limit") || 10)));
    const offset = Math.max(0, asInt(url.searchParams.get("offset") || 0));
    const q      = (url.searchParams.get("q") || "").trim();
    const status = url.searchParams.get("status"); // 1/0/2 optional
    const vendorIdParam = url.searchParams.get("vendor_id");
    const dateFrom = url.searchParams.get("date_from"); // ISO/ yyyy-mm-dd
    const dateTo   = url.searchParams.get("date_to");   // ISO/ yyyy-mm-dd
    const sortByQ  = (url.searchParams.get("sortBy") || "redeemed_at").toString();
    const sortDirQ = (url.searchParams.get("sortDir") || "desc").toString().toLowerCase();

    // sort guard
    const ALLOWED_SORT = new Set(["redeemed_at","created_at","status","id"]);
    const sortBy  = ALLOWED_SORT.has(sortByQ) ? sortByQ : "redeemed_at";
    const sortDir = sortDirQ === "asc" ? "asc" : "desc";

    // where builder
    const AND = [];

    // search
    if (q) {
      AND.push({
        OR: [
          { voucher: { code_voucher: { contains: q, mode: "insensitive" } } },
          { voucher: { title: { contains: q, mode: "insensitive" } } },
          { voucher: { category: { category_name: { contains: q, mode: "insensitive" } } } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { vendor: { name: { contains: q, mode: "insensitive" } } },
        ],
      });
    }

    // status (optional)
    if (status !== null && status !== undefined && status !== "" && !Number.isNaN(Number(status))) {
      AND.push({ status: Number(status) });
    }

    // date range by redeemed_at
    if (dateFrom || dateTo) {
      const range = {};
      if (dateFrom) range.gte = new Date(dateFrom);
      if (dateTo) {
        // sampai akhir hari
        const to = new Date(dateTo);
        to.setHours(23,59,59,999);
        range.lte = to;
      }
      AND.push({ redeemed_at: range });
    }

    // role-based vendor scoping
    let effectiveVendorId = null;
    if (isAdmin) {
      if (vendorIdParam) {
        const vid = Number(vendorIdParam);
        if (!Number.isNaN(vid)) effectiveVendorId = vid;
      }
    } else {
      const vendor = await prisma.ms_vendor.findFirst({
        where: { user_id: userId },
        select: { id: true },
      });
      if (!vendor) {
        return new NextResponse(JSON.stringify({ error: "Vendor record not found for this user" }), {
          status: 403, headers: cors,
        });
      }
      effectiveVendorId = vendor.id;
    }
    if (effectiveVendorId != null) AND.push({ vendor_id: effectiveVendorId });

    // build prisma query
    const query = {
      orderBy: { [sortBy]: sortDir },
      skip: offset,
      take: limit,
      select: {
            id: true,
            voucher_id: true,
            user_id: true,
            vendor_id: true,
            source: true,
            device_info: true,
            ip_address: true,
            status: true,
            note: true,
            redeemed_at: true,
            created_at: true,
            updated_at: true,
            voucher: {
            select: {
                id: true,
                code_voucher: true,
                title: true,
                price: true,
                category: { select: { id: true, category_name: true } },
            },
            },
        user:   { select: { id: true, name: true, email: true } },
        vendor: { select: { id: true, name: true, email: true } },
      },
    };
    if (AND.length) query.where = { AND };

    // query + count
    const [rows, total] = await Promise.all([
      prisma.ms_voucher_redeem.findMany(query),
      prisma.ms_voucher_redeem.count(AND.length ? { where: { AND } } : {}),
    ]);

    // map response
    const items = rows.map((r) => ({
      id: r.id,
      voucher_id: r.voucher_id,
      vendor_id: r.vendor_id,
      user_id: r.user_id,
      status: r.status,
      note: r.note,
      redeemed_at: r.redeemed_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      voucher: r.voucher
        ? {
            id: r.voucher.id,
            code: r.voucher.code_voucher,
            title: r.voucher.title,
            category: r.voucher.category
              ? { id: r.voucher.category.id, name: r.voucher.category.category_name }
              : null,
            price: r.voucher.price != null ? Number(r.voucher.price) : null,
          }
        : null,
      customer: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email } : null,
      vendor:   r.vendor ? { id: r.vendor.id, name: r.vendor.name, email: r.vendor.email } : null,
    }));

    return NextResponse.json(
      {
        message: "Redeem list",
        pagination: { total, limit, offset },
        items,
      },
      { headers: cors }
    );
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: cors }
    );
  }
}

