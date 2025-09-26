// app/api/category/list-category/route.js
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

/** ---------- CORS allowlist ---------- */
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // ex: https://frontend.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // ex: http://localhost:3001
  "http://localhost:3001",
].filter(Boolean);

function cors(req) {
  const o = req.headers.get("origin") || "";
  const allow = ALLOWLIST.includes(o) ? o : ALLOWLIST[0] || "*";
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
  return new Response(null, { status: 204, headers: cors(req) });
}

/** ---------- GET /api/category/list-category ---------- */
const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const toDir = (v) => (String(v).toLowerCase() === "asc" ? "asc" : "desc");

export async function GET(req) {
  const headers = cors(req);
  try {
    // -- Auth (optional: hapus blok ini kalau mau public)
    const auth = req.headers.get("authorization") || "";
    if (!auth.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }
    try {
      jwt.verify(auth.slice(7), process.env.NEXTAUTH_SECRET);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
    }

    const sp = new URL(req.url).searchParams;
    const pageParam = toInt(sp.get("page"), null);
    const pageSizeParam = toInt(sp.get("pageSize"), null);

    let limit = toInt(sp.get("limit"), pageSizeParam ?? 10);
    limit = Math.min(Math.max(1, limit || 10), 100);

    let offset = toInt(sp.get("offset"), 0);
    if (pageParam && pageSizeParam) offset = Math.max(0, (pageParam - 1) * pageSizeParam);

    const q = (sp.get("q") || "").trim();
    const statusStr = sp.get("status"); // 1|0
    const sortByRaw = (sp.get("sortBy") || "created_at").toLowerCase();
    const sortDir = toDir(sp.get("sortDir") || "desc");

    const sortMap = {
      category_name: "category_name",
      status: "status",
      created_at: "created_at",
      updated_at: "updated_at",
    };
    const orderBy = { [sortMap[sortByRaw] || "created_at"]: sortDir };

    const where = {};
    if (q) {
      where.category_name = { contains: q, mode: "insensitive" };
    }
    if (statusStr !== null && statusStr !== "") {
      const s = Number(statusStr);
      if (Number.isInteger(s)) where.status = s;
    }

    const [total, rows] = await Promise.all([
      prisma.category_vouchers.count({ where }),
      prisma.category_vouchers.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true,
          category_name: true,
          status: true,
          created_at: true,
          created_by: true,
          updated_at: true,
          updated_by: true,
        },
      }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const resp = {
      categories: rows,
      pagination: { limit, offset, total },
      page,
      pageSize: limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      data: rows, // alias
    };

    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message ?? "Internal error" }), {
      status: 500,
      headers,
    });
  }
}
