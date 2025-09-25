import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    let decoded
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
    }

    // hanya Customer yg boleh
    if (decoded.role !== "Customer") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only customers can view vouchers" }),
        { status: 403 }
      )
    }

    // ambil query param limit & offset
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50)
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0)

    // ambil data voucher
    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        orderBy: { startAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.voucher.count(),
    ])

    return Response.json({
      message: "Voucher list",
      pagination: {
        total,
        limit,
        offset,
      },
      data: vouchers,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
