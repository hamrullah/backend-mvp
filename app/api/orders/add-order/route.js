// app/api/orders/route.js  (atau .../add-order/route.js)
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

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
    "Access-Control-Allow-Methods": "POST,OPTIONS",
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
function getBearer(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (h && h.toLowerCase().startsWith("bearer ")) return h.slice(7);
  return null;
}

export async function POST(req) {
  const cors = buildCors(req);
  try {
    // --- Auth (boleh siapa pun yg punya token; kamu bisa batasi role kalau perlu)
    const token = getBearer(req);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }
    try {
      jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
    }

    // --- Payload
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: cors });
    }

    const member_id = Number(body.member_id);
    const payment_methode = String(body.payment_methode || "Manual");
    const status = Number.isInteger(body.status) ? Number(body.status) : 0; // 0=Pending
    const flag = Number.isInteger(body.flag) ? Number(body.flag) : 1;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!member_id) {
      return new Response(JSON.stringify({ error: "member_id is required" }), { status: 400, headers: cors });
    }
    if (!items.length) {
      return new Response(JSON.stringify({ error: "Items are required" }), { status: 400, headers: cors });
    }

    // optional: pastikan member ada
    const member = await prisma.ms_member.findUnique({ where: { id: member_id }, select: { id: true }});
    if (!member) {
      return new Response(JSON.stringify({ error: "Member not found" }), { status: 404, headers: cors });
    }

    // --- validasi item + siapkan detail
    // catatan: kita hormati harga dari body; kalau kosong, fallback ke harga voucher di DB
    let totalAmount = 0;
    const detailData = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const voucher_id = Number(it.voucher_id);
      const qty = Number(it.qty);
      let price = it.price != null ? Number(it.price) : NaN;

      if (!Number.isInteger(voucher_id) || voucher_id <= 0) {
        return new Response(JSON.stringify({ error: `items[${i}].voucher_id invalid` }), { status: 400, headers: cors });
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        return new Response(JSON.stringify({ error: `items[${i}].qty must be integer > 0` }), { status: 400, headers: cors });
      }

      // fallback harga dari DB kalau price tidak valid
      if (!Number.isFinite(price) || price < 0) {
        const v = await prisma.ms_vouchers.findUnique({
          where: { id: voucher_id },
          select: { price: true },
        });
        if (!v) {
          return new Response(JSON.stringify({ error: `Voucher ${voucher_id} not found` }), { status: 404, headers: cors });
        }
        price = Number(v.price);
      }

      const sub = price * qty;
      totalAmount += sub;

      detailData.push({
        voucher_id,
        qty,
        price: price.toFixed(2),        // Decimal write as string
        sub_total: sub.toFixed(2),
        status: 1,
        flag: 1,
      });
    }

    // --- transaksi order + detail
    const created = await prisma.$transaction(async (tx) => {
      const code = `TRX-${nanoid()}`;

      const order = await tx.trx_orders.create({
        data: {
          code_trx: code,
          member_id,
          totalAmount: totalAmount.toFixed(2),
          payment_methode,
          status,
          flag,
          date_order: new Date(),
          items: { create: detailData },
        },
        select: { id: true },
      });

      return tx.trx_orders.findUnique({
        where: { id: order.id },
        include: {
          member: { select: { id: true, code_member: true, name_member: true } },
          items: {
            include: {
              voucher: {
                select: { id: true, code_voucher: true, title: true, vendor_id: true, price: true },
              },
            },
          },
        },
      });
    });

    // --- shape response buat FE
    const data = {
      id: created.id,
      code_trx: created.code_trx,
      member_id: created.member_id,
      totalAmount: Number(created.totalAmount),
      payment_methode: created.payment_methode,
      status: created.status,
      flag: created.flag,
      date_order: created.date_order,
      created_at: created.created_at,
      created_by: created.created_by,
      updated_at: created.updated_at,
      updated_by: created.updated_by,
      member: created.member,
      details: created.items.map((d) => ({
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
    };

    return new Response(JSON.stringify({ message: "Order created", data }), {
      status: 201,
      headers: cors,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: cors,
    });
  }
}
