import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

// --- CORS helper
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // ganti ke domain frontend di produksi
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function GET(req) {
  try {
    // --- Auth
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders(),
      })
    }
    const token = authHeader.split(" ")[1]
    let decoded
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: corsHeaders(),
      })
    }

    const role = decoded.role
    if (!["CUSTOMER", "ADMIN", "MEMBER"].includes(role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders(),
      })
    }

    // --- Query params
    const { searchParams } = new URL(req.url)
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "10", 10), 1), 100)
    const q = searchParams.get("q") || undefined
    const status = searchParams.get("status") || undefined // INT di DB (1=aktif, dsb)
    const from = searchParams.get("from") // ISO date
    const to = searchParams.get("to")     // ISO date
    const vendorId = searchParams.get("vendorId") || undefined // filter via voucher.vendor_id

    // --- Build where sesuai schema
    const where = {}

    // Customer hanya lihat order miliknya (decoded.id diasumsikan ms_member.id)
    if (role === "CUSTOMER") where.member_id = decoded.id

    if (status) where.status = Number(status)

    if (from || to) {
      where.date_order = {}
      if (from) where.date_order.gte = new Date(from)
      if (to) {
        const end = new Date(to)
        end.setDate(end.getDate() + 1) // inclusive
        where.date_order.lte = end
      }
    }

    if (q) {
      // cari di code_trx atau judul voucher
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
      ]
    }

    if (vendorId) {
      where.items = {
        some: { voucher: { vendor_id: Number(vendorId) } },
      }
    }

    // --- Query DB (pakai model prisma.trx_orders)
    const [total, orders] = await prisma.$transaction([
      prisma.trx_orders.count({ where }),
      prisma.trx_orders.findMany({
        where,
        orderBy: { date_order: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          // relasi ke detail & voucher
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
          // relasi ke member kalau mau ditampilkan
          member: {
            select: { id: true, code_member: true, name_member: true },
          },
        },
      }),
    ])

    // --- Hasil langsung sesuai nama kolom di DB
    // (konversi Decimal ke Number untuk keamanan JSON)
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
    }))

    return new Response(
      JSON.stringify({
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        data,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders(),
    })
  }
}
