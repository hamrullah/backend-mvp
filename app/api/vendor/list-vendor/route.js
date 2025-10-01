// app/api/vendor/list-vendor/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

// ---------- CORS (whitelist & reflect) ----------
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // ex: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // ex: http://localhost:3001 (dev)
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin");
  const allow = ALLOWLIST.includes(origin) ? origin : (ALLOWLIST[0] || "*");

  const headers = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Content-Type": "application/json",
  });

  if (allow !== "*") headers.set("Access-Control-Allow-Credentials", "true");
  return headers;
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: buildCors(req) });
}

function getTokenFromRequest(req) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7);
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const m = cookie.match(/(?:^|; )token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

// Helpers to normalize role from token
const ROLE_BY_ID = { 7: "MEMBER", 5: "VENDOR", 6: "AFFILIATE", 4: "ADMIN" };
function normalizeRole(claims) {
  const roleFromClaim = claims?.role
    ? String(claims.role).toUpperCase()
    : null;
  const roleFromId = claims?.role_id ? ROLE_BY_ID[Number(claims.role_id)] : null;
  return (roleFromClaim || roleFromId || "GUEST").toUpperCase();
}
function normalizeUserId(claims) {
  // support a few common shapes
  return Number(
    claims?.id ??
    claims?.userId ??
    claims?.user_id ??
    claims?.user?.id
  );
}

// ---------- LIST VENDOR ----------
export async function GET(req) {
  const cors = buildCors(req);
  try {
    // Auth (Bearer/Cookie)
    const token = getTokenFromRequest(req);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    let claims;
    try {
      claims = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
    }

    const role = normalizeRole(claims);
    const requesterUserId = normalizeUserId(claims);

    // Query params
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));
    const q = (searchParams.get("q") || "").trim();
    const statusParam = searchParams.get("status");

    // sort whitelist → field prisma
    const allowSortBy = new Set(["created_at", "updated_at", "name", "email", "city", "province", "status"]);
    const sortKeyMap = {
      created_at: "created_at",
      updated_at: "updated_at",
      name: "name",
      email: "email",
      city: "city",
      province: "province",
      status: "status",
    };
    const sortByRaw = searchParams.get("sortBy") || "created_at";
    const sortBy = allowSortBy.has(sortByRaw) ? sortByRaw : "created_at";
    const sortDir = (searchParams.get("sortDir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

    // WHERE base (filters)
    const where = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { code_vendor: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { province: { contains: q, mode: "insensitive" } },
      ];
    }
    if (statusParam !== null && statusParam !== undefined && statusParam !== "") {
      where.status = Number(statusParam);
    }

    // ---------- Role-based scope ----------
    if (role === "ADMIN") {
      // no extra restriction
    } else if (role === "VENDOR") {
      // vendor can only see its own vendor row by user_id
      if (!Number.isFinite(requesterUserId)) {
        return new NextResponse(JSON.stringify({ error: "Forbidden: invalid user id in token" }), {
          status: 403,
          headers: cors,
        });
      }
      where.user_id = requesterUserId;
    } else {
      // other roles are not allowed to list vendors
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });
    }

    // Query
    const [rows, total] = await Promise.all([
      prisma.ms_vendor.findMany({
        where,
        orderBy: { [sortKeyMap[sortBy]]: sortDir },
        take: limit,
        skip: offset,
        select: {
          id: true,
          code_vendor: true,
          name: true,
          email: true,
          address: true,
          city: true,
          province: true,
          postal_code: true,
          image: true,
          twitter: true,
          instagram: true,
          tiktok: true,
          user_id: true,
          status: true,
          flag: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.ms_vendor.count({ where }),
    ]);

    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
    const vendors = rows.map((v) => ({
      ...v,
      image_url: v.image ? (v.image.startsWith("http") ? v.image : `${base}${v.image}`) : null,
    }));

    return new NextResponse(
      JSON.stringify({
        message: "Vendor list",
        pagination: { total, limit, offset },
        vendors,
        // extras for UI compatibility:
        page: Math.floor(offset / (limit || 1)) + 1,
        pageSize: limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / (limit || 1))),
        data: vendors,
      }),
      { status: 200, headers: cors }
    );
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500,
      headers: cors,
    });
  }
}
