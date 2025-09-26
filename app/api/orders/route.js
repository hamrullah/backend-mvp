// app/api/orders/route.js (atau sesuai lokasimu)
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// ===== CORS (reflect allowlist) =====
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // ex: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // ex: http://localhost:3001
  "http://localhost:3001",            // fallback dev
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
  return new Response(null, { status: 204, headers: buildCors(req) });
}

// ===== helpers =====
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

export async function GET(req) {
  const cors = buildCors(req);
  try {
    // --- Auth ---
    const token = getToken(req);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
    }

    // Role yang diizinkan (samakan dengan yang kamu kirim dari /auth/login)
    const role = (payload.role || "").toUpperCase();
    const allowed = new Set(["ADMIN", "VENDOR", "AFFILIATE", "MEMBER"]);
    if (!allowed.has(role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });
    }

    // --- Query params ---
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "10", 10), 1), 100);
    const q = (searchParams.get("q") || "").trim() || undefined;
    const statusParam = searchParams.get("status") || undefined; // int
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const vendorId = searchParams.get("vendorId") || undefined;

    // --- Build where ---
    const where = {};

    // Jika role MEMBER: map users.id -> ms_member.id lalu batasi by member_id
    if (role === "MEMBER") {
      const me = await prisma.ms_member.findFirst({
        where: { user_id: payload.id },
        select: { id: true },
      });
      // kalau tidak punya profil member, kosongkan hasil
      where.member_id = me?.id ?? -1;
    }

    if (statusParam) where.status = Number(statusParam);

    if (from || to) {
      where.date_order = {};
      if (from) where.date_order.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setDate(end.getDate() + 1); // inclusive
        where.date_order.lte = end;
      }
    }

    if (q) {
      where.OR = [
        { code_trx: { contains: q, mode: "insensitive" } },
        {
          items: {
            some: {
              voucher: {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { code_voucher: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ];
    }

    if (vendorId) {
      // filter order yang minimal punya 1 item dari vendor tersebut
      where.items = {
        some: { voucher: { vendor_id: Number(vendorId) } },
      };
    }

    // --- Query DB ---
    const [total, orders] = await prisma.$transaction([
      prisma.trx_orders.count({ where }),
      prisma.trx_orders.findMany({
        where,
        orderBy: { date_order: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            include: {
              voucher: {
                select: {
                  id: true,
                  code_voucher: true,
                  title: true,
                  vendor_id: true,
                  price: true,
                },
              },
            },
          },
          member: { select: { id: true, code_member: true, name_member: true } },
        },
      }),
    ]);

    const data = orders.map((o) => ({
      id: o.id,
      code_trx: o.code_trx,
      member_id: o.member_id,
      totalAmount: Number(o.totalAmount),
      payment_methode: o.payment_methode,
      status: o.status,
      flag: o.flag,
      date_order: o.date_order,
      created_at: o.created_at,
      created_by: o.created_by,
      updated_at: o.updated_at,
      updated_by: o.updated_by,
      member: o.member,
      details: o.items.map((d) => ({
        id: d.id,
        order_id: d.order_id,
        voucher_id: d.voucher_id,
        qty: d.qty,
        price: Number(d.price),
        sub_total: Number(d.sub_total),
        status: d.status,
        flag: d.flag,
        created_at: d.created_at,
        created_by: d.created_by,
        updated_at: d.updated_at,
        updated_by: d.updated_by,
        voucher: d.voucher
          ? {
              id: d.voucher.id,
              code_voucher: d.voucher.code_voucher,
              title: d.voucher.title,
              vendor_id: d.voucher.vendor_id,
              price: Number(d.voucher.price),
            }
          : null,
      })),
    }));

    return new Response(
      JSON.stringify({
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        data,
      }),
      { status: 200, headers: cors }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500,
      headers: cors,
    });
  }
}
