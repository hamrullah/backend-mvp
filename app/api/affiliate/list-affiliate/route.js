// app/api/affiliate/list-affiliate/route.js
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// ===== CORS (allowlist & reflect Origin) =====
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // contoh: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // contoh: http://localhost:3001
  "http://localhost:3001",
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin") || "";
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
  return new Response(null, { status: 204, headers: buildCors(req) });
}

// ---------- Utils ----------
const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const toBool = (v) => v === "1" || v === "true";

// ---------- GET /api/affiliate/list-affiliate ----------
export async function GET(req) {
  const cors = buildCors(req);
  try {
    // (opsional) Auth via JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: cors,
      });
    }
    try {
      jwt.verify(authHeader.split(" ")[1], process.env.NEXTAUTH_SECRET);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: cors,
      });
    }

    const sp = new URL(req.url).searchParams;

    // Pagination: support limit/offset atau page/pageSize
    const pageParam = sp.get("page");
    const pageSizeParam = sp.get("pageSize");
    let limit = toInt(sp.get("limit"), toInt(pageSizeParam, 10));
    limit = Math.min(Math.max(1, limit || 10), 100);

    let offset = toInt(sp.get("offset"), 0);
    if (pageParam) {
      const page = Math.max(1, toInt(pageParam, 1));
      offset = (page - 1) * limit;
    }
    offset = Math.max(0, offset);

    // Filters
    const q = (sp.get("q") || "").trim();
    const status = sp.get("status"); // 0/1/""
    const city = (sp.get("city") || "").trim();
    const province = (sp.get("province") || "").trim();
    const hasUser = toBool(sp.get("hasUser"));

    const from = sp.get("from"); // YYYY-MM-DD
    const to = sp.get("to");     // YYYY-MM-DD

    // Sorting
    const sortBy = (sp.get("sortBy") || "created_at").toLowerCase();
    const sortDir = (sp.get("sortDir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
    const sortMap = {
      name: "name_affiliate",
      created_at: "created_at",
      updated_at: "updated_at",
      email: "email",
      city: "city",
      status: "status",
    };
    const orderBy = { [sortMap[sortBy] || "created_at"]: sortDir };

    // Where
    const where = { AND: [] };

    if (q) {
      where.AND.push({
        OR: [
          { code_affiliate: { contains: q, mode: "insensitive" } },
          { name_affiliate: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { referral_code: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { province: { contains: q, mode: "insensitive" } },
          { twitter: { contains: q, mode: "insensitive" } },
          { instagram: { contains: q, mode: "insensitive" } },
          { tiktok: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    if (status !== null && status !== "") {
      const s = Number(status);
      if (Number.isInteger(s)) where.AND.push({ status: s });
    }
    if (city) where.AND.push({ city: { contains: city, mode: "insensitive" } });
    if (province) where.AND.push({ province: { contains: province, mode: "insensitive" } });
    if (hasUser) where.AND.push({ NOT: { user_id: null } });

    if (from || to) {
      const range = {};
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) range.gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) range.lte = new Date(d.getTime() + 86400000 - 1);
      }
      if (Object.keys(range).length) where.AND.push({ created_at: range });
    }

    // Query
    const [total, rows] = await Promise.all([
      prisma.ms_affiliate.count({ where }),
      prisma.ms_affiliate.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true,
          code_affiliate: true,
          name_affiliate: true,
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
          referral_code: true,
          _count: { select: { members: true } },
        },
      }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      code_affiliate: r.code_affiliate,
      name_affiliate: r.name_affiliate,
      email: r.email,
      address: r.address,
      city: r.city,
      province: r.province,
      postal_code: r.postal_code,
      image: r.image,
      twitter: r.twitter,
      instagram: r.instagram,
      tiktok: r.tiktok,
      user_id: r.user_id,
      status: r.status,
      flag: r.flag,
      created_at: r.created_at,
      updated_at: r.updated_at,
      referral_code: r.referral_code,
      members_count: r._count?.members ?? 0,
    }));

    const page = Math.floor(offset / limit) + 1;

    return new Response(
      JSON.stringify({
        affiliates: data,
        pagination: { limit, offset, total },
        page,
        pageSize: limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        data,
      }),
      { status: 200, headers: cors }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500,
      headers: buildCors(req),
    });
  }
}
