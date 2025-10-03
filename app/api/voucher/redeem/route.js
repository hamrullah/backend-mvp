import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

/** ---------- CORS (allow non-browser; block only unknown browser origins) ---------- */
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_ORIGIN_LOCAL,
].filter(Boolean);

function corsKit(req) {
  const origin = req.headers.get("origin");
  const hasOrigin = !!origin;
  const isAllowed = hasOrigin ? ALLOWLIST.includes(origin) : true;
  const reqHeaders = req.headers.get("access-control-request-headers") || "Content-Type, Authorization";

  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": reqHeaders,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json",
  });
  if (hasOrigin && isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  return { headers, hasOrigin, isAllowed };
}

export async function OPTIONS(req) {
  const { headers, hasOrigin, isAllowed } = corsKit(req);
  if (!hasOrigin) return new NextResponse(null, { status: 204 });
  return new NextResponse(null, { status: isAllowed ? 204 : 403, headers: isAllowed ? headers : undefined });
}

/** ------------------- Auth helpers ------------------- */
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

function parseUser(payload) {
  const userId = Number(payload?.id ?? payload?.userId ?? payload?.uid ?? payload?.sub);
  const roleId = Number(payload?.role_id ?? payload?.roleId);
  const role = (payload?.role ?? payload?.role_name ?? "").toString().toLowerCase();
  // you said ADMIN = role_id 4
  const isAdmin = role === "admin" || roleId === 4;
  const isVendor = role === "vendor";
  return { userId, roleId, role, isAdmin, isVendor };
}

// pick the correct Prisma accessor (supports both styles)
function getRedeemModel() {
  const Redeem = prisma.ms_voucher_redeem;
  if (!Redeem) {
    // Helpful error if client wasn’t regenerated or import path is wrong
    throw new Error(
      "Prisma model not found: expected prisma.ms_voucher_redeem or prisma.voucherRedeem. " +
      "Run `npx prisma generate`, restart dev server, and ensure lib/prisma imports the generated client."
    );
  }
  return Redeem;
}

/** ------------------- GET /api/voucher/redeem  (LIST) ------------------- */
export async function GET(req) {
  const { headers: cors, hasOrigin, isAllowed } = corsKit(req);
  if (hasOrigin && !isAllowed) {
    return new NextResponse(JSON.stringify({ error: "Origin not allowed" }), { status: 403 });
  }

  try {
    const token = getToken(req);
    if (!token) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    let payload;
    try { payload = jwt.verify(token, process.env.NEXTAUTH_SECRET); }
    catch { return new NextResponse(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors }); }

    const { userId, isAdmin, isVendor } = parseUser(payload);
    if (!userId) return new NextResponse(JSON.stringify({ error: "Invalid token payload" }), { status: 401, headers: cors });

    const url = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));
    const sortByRaw = (url.searchParams.get("sortBy") || "redeemed_at").toLowerCase();
    const sortDir = (url.searchParams.get("sortDir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
    const allowSortBy = new Set(["redeemed_at", "created_at", "updated_at", "id", "order_id", "status"]);
    const sortBy = allowSortBy.has(sortByRaw) ? sortByRaw : "redeemed_at";

    const vendorIdParam = url.searchParams.get("vendor_id");
    const userIdParam = url.searchParams.get("user_id");
    const voucherIdParam = url.searchParams.get("voucher_id");
    const statusParam = url.searchParams.get("status");
    const q = (url.searchParams.get("q") || "").trim();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const AND = [];

    // scope by role
    if (isAdmin) {
      if (vendorIdParam) AND.push({ vendor_id: Number(vendorIdParam) });
      if (userIdParam) AND.push({ user_id: Number(userIdParam) });
    } else if (isVendor) {
      const vendor = await prisma.ms_vendor.findFirst({ where: { user_id: userId }, select: { id: true } });
      if (!vendor) return new NextResponse(JSON.stringify({ error: "Vendor record not found" }), { status: 403, headers: cors });
      AND.push({ vendor_id: vendor.id });
      if (userIdParam) AND.push({ user_id: Number(userIdParam) });
    } else {
      AND.push({ user_id: userId });
    }

    if (voucherIdParam) AND.push({ voucher_id: Number(voucherIdParam) });
    if (statusParam !== null && statusParam !== undefined && statusParam !== "") {
      AND.push({ status: Number(statusParam) });
    }

    // date range on redeemed_at
    if (from || to) {
      const range = {};
      if (from) { const d = new Date(from); if (!isNaN(d)) range.gte = d; }
      if (to)   { const d = new Date(to);   if (!isNaN(d)) range.lt = d; }
      if (Object.keys(range).length) AND.push({ redeemed_at: range });
    }

    // text search: IMPORTANT → for 1:1 or n:1 relations use `is: { ... }`
//      if (q) {
//   const qNum = Number(q);
//    const byOrderId = Number.isInteger(qNum) ? [{ order_id: qNum }] : [];
//    AND.push({
//      OR: [
//        ...byOrderId,
//        { voucher: { is: { code_voucher: { contains: q, mode: "insensitive" } } } },
//        { voucher: { is: { title: { contains: q, mode: "insensitive" } } } },
//        { user:    { is: { name:  { contains: q, mode: "insensitive" } } } },
//        { user:    { is: { email: { contains: q, mode: "insensitive" } } } },
//      ],
//    });
//  }

    const where = AND.length ? { AND } : undefined;

    const Redeem = getRedeemModel();

    const [rows, total] = await Promise.all([
      Redeem.findMany({
        where,
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
          voucher: { select: { code_voucher: true, title: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      Redeem.count({ where }),
    ]);

    return NextResponse.json(
      { message: "Redeem list", pagination: { total, limit, offset }, data: rows },
      { headers: cors }
    );
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500,
      headers: cors,
    });
  }
}

/** ------------------- POST /api/voucher/redeem (simple create) ------------------- */
export async function POST(req) {
  const { headers: cors, hasOrigin, isAllowed } = corsKit(req);
  if (hasOrigin && !isAllowed) {
    return new NextResponse(JSON.stringify({ error: "Origin not allowed" }), { status: 403 });
  }

  try {
    const token = getToken(req);
    if (!token) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    let payload;
    try { payload = jwt.verify(token, process.env.NEXTAUTH_SECRET); }
    catch { return new NextResponse(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors }); }

    const { userId } = parseUser(payload);
    if (!userId) return new NextResponse(JSON.stringify({ error: "Invalid token payload" }), { status: 401, headers: cors });

    const raw = await req.json().catch(() => ({}));
    const voucherId = Number(raw?.voucher_id);
    //const orderId = raw?.order_id ?? raw?.["order_id "] ?? null; // tolerate trailing space
  const  orderIdRaw = raw?.order_id ?? raw?.["order_id "]; // support key typo
const orderId =
   orderIdRaw === undefined || orderIdRaw === null || orderIdRaw === ""
     ? null
     : String(orderIdRaw); // <-- paksa String
    const source = raw?.source ? String(raw.source) : "web";
    const device_info = raw?.device_info ? String(raw.device_info) : null;

    if (!voucherId || Number.isNaN(voucherId)) {
      return new NextResponse(JSON.stringify({ error: "voucher_id is required" }), { status: 400, headers: cors });
    }

    const voucher = await prisma.ms_vouchers.findUnique({
      where: { id: voucherId },
      select: { id: true, vendor_id: true },
    });
    if (!voucher) return new NextResponse(JSON.stringify({ error: "Voucher not found" }), { status: 404, headers: cors });

    const Redeem = getRedeemModel();
    const now = new Date();
    console.log({ orderId });
    const created = await Redeem.create({
      data: {
        voucher_id: voucher.id,
        user_id: userId,
        vendor_id: voucher.vendor_id,
        order_id: orderId,
        source,
        device_info: device_info || req.headers.get("user-agent") || null,
        ip_address: req.headers.get("x-forwarded-for") || null,
        status: 1,
        redeemed_at: now,
        created_at: now,
        updated_at: now,
      },
      select: {
        id: true,
        voucher_id: true,
        user_id: true,
        vendor_id: true,
        order_id: true,
        redeemed_at: true,
      },
    });

    return NextResponse.json({ message: "Redeemed", redeem: created }, { headers: cors });
  } catch (err) {
    if (err?.code === "P2002" && Array.isArray(err?.meta?.target) && err.meta.target.includes("order_id")) {
      return new NextResponse(JSON.stringify({ error: "order_id already used" }), { status: 409, headers: cors });
    }
    return new NextResponse(JSON.stringify({ error: err?.message ?? "Internal server error" }), { status: 500, headers: cors });
  }
}
