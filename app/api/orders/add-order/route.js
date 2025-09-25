import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { customAlphabet } from "nanoid"

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8)

// ---------- CORS ----------
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // ganti ke domain frontend untuk prod
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

// ---------- POST /api/orders ----------
export async function POST(req) {
  try {
    // --- Auth (Customer only)
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders(),
      })
    }

    let decoded
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], process.env.NEXTAUTH_SECRET)
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: corsHeaders(),
      })
    }

    // if (decoded.role !== "Customer") {
    //   return new Response(JSON.stringify({ error: "Forbidden: Customer only" }), {
    //     status: 403, headers: corsHeaders(),
    //   })
    // }

    // --- Payload
    const body = await req.json().catch(() => ({}))
    const member_id = Number(body.member_id)
    const payment_methode = String(body.payment_methode || "Manual")
    const status = Number.isInteger(body.status) ? Number(body.status) : 0 // default Pending
    const flag = Number.isInteger(body.flag) ? Number(body.flag) : 1
    const items = Array.isArray(body.items) ? body.items : []

    if (!member_id) {
      return new Response(JSON.stringify({ error: "member_id is required" }), {
        status: 400, headers: corsHeaders(),
      })
    }
    if (!items.length) {
      return new Response(JSON.stringify({ error: "Items are required" }), {
        status: 400, headers: corsHeaders(),
      })
    }

    // --- Validasi & siapkan detail
    let totalAmount = 0
    const detailData = []

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const voucher_id = Number(it.voucher_id)
      const qty = Number(it.qty)
      const price = Number(it.price)

      if (!Number.isInteger(voucher_id) || voucher_id <= 0) {
        return new Response(JSON.stringify({ error: `items[${i}].voucher_id invalid` }), {
          status: 400, headers: corsHeaders(),
        })
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        return new Response(JSON.stringify({ error: `items[${i}].qty must be integer > 0` }), {
          status: 400, headers: corsHeaders(),
        })
      }
      if (!Number.isFinite(price) || price < 0) {
        return new Response(JSON.stringify({ error: `items[${i}].price must be >= 0` }), {
          status: 400, headers: corsHeaders(),
        })
      }

      const sub = price * qty
      totalAmount += sub

      detailData.push({
        voucher_id,
        qty,
        price: String(price.toFixed(2)),      // Decimal → string saat write
        sub_total: String(sub.toFixed(2)),
        status: 1,
        flag: 1,
      })
    }

    // --- Transaksi: header + detail
    const created = await prisma.$transaction(async (tx) => {
      const code = `TRX-${nanoid()}`

      const order = await tx.trx_orders.create({
        data: {
          code_trx: code,
          member_id,
          totalAmount: String(totalAmount.toFixed(2)),
          payment_methode,
          status,
          flag,
          date_order: new Date(),
          items: { create: detailData },
        },
      })

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
      })
    })

    // --- Response format sama dengan GET /api/orders
    const response = {
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
    }

    return new Response(JSON.stringify({ message: "Order created", data: response }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders(),
    })
  }
}
