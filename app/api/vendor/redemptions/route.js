import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    let decoded
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
    }

    if (decoded.role !== "Vendor") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only vendors can view redemptions" }),
        { status: 403 }
      )
    }

    // pagination
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50)
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0)

    // cek vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { ownerUserId: decoded.id },
    })
    if (!vendor) {
      return new Response(
        JSON.stringify({ error: "Vendor profile not found" }),
        { status: 404 }
      )
    }

    // ambil data redemption
    const [redemptions, total] = await Promise.all([
      prisma.redemptionLog.findMany({
        where: { vendorId: vendor.id },
        include: {
          voucherInstance: {
            include: {
              orderItem: {
                include: {
                  voucher: {
                    select: {
                      id: true,
                      title: true,
                      price: true,
                      startAt: true,
                      endAt: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" }, // pastikan ada createdAt di model
      }),
      prisma.redemptionLog.count({
        where: { vendorId: vendor.id },
      }),
    ])

    // mapping hasil agar mirip dengan query SQL
    const data = redemptions.map((r) => ({
      voucherId: r.voucherInstance.orderItem.voucher.id,
      title: r.voucherInstance.orderItem.voucher.title,
      price: r.voucherInstance.orderItem.voucher.price,
      startAt: r.voucherInstance.orderItem.voucher.startAt,
      endAt: r.voucherInstance.orderItem.voucher.endAt,
      qty: r.voucherInstance.orderItem.qty,
      unitPrice: r.voucherInstance.orderItem.unitPrice,
    }))

    return Response.json({
      message: "Redemption list",
      pagination: { total, limit, offset },
      data,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
