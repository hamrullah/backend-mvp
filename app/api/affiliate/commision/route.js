import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization")
    console.log('loggg',authHeader)
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    let decoded
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
    }

    if (decoded.role !== "Affiliate") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only Affiliate can view commissions" }),
        { status: 403 }
      )
    }

    // ambil affiliate dari user
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: decoded.id },
    })

    if (!affiliate) {
      return new Response(JSON.stringify({ error: "Affiliate not found" }), { status: 404 })
    }

    // ambil query limit & offset
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const [commissions, total] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where: { affiliateId: affiliate.id },
        skip: offset,
        take: limit,
        include: {
          order: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.affiliateCommission.count({
        where: { affiliateId: affiliate.id },
      }),
    ])

    return Response.json({
      message: "Affiliate commissions list",
      total,
      limit,
      offset,
      data: commissions,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
