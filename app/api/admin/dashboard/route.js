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
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
    }

    if (decoded.role !== "Admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only Admin can access dashboard" }),
        { status: 403 }
      )
    }

    // ambil statistik
    const [customers, vendors, affiliates, orders, totalRevenue, totalCommission, totalPayable] =
      await Promise.all([
        prisma.customer.count(),
        prisma.vendor.count(),
        prisma.affiliate.count(),
        prisma.order.count(),
        prisma.order.aggregate({ _sum: { totalAmount: true } }),
        prisma.affiliateCommission.aggregate({ _sum: { amount: true } }),
        prisma.vendorPayable.aggregate({ _sum: { netAmount: true } }),
      ])

    return Response.json({
      message: "Admin dashboard summary",
      stats: {
        totalCustomers: customers,
        totalVendors: vendors,
        totalAffiliates: affiliates,
        totalOrders: orders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalCommission: totalCommission._sum.amount || 0,
        totalPayable: totalPayable._sum.netAmount || 0,
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
