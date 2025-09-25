import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function GET(req, { params }) {
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

    if (decoded.role !== "Customer") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only Customer can view orders" }),
        { status: 403 }
      )
    }

    const { id } = params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            voucher: true,
            instances: true, // voucherInstances (kode voucher unik)
          },
        },
        affiliate: true,
      },
    })

    if (!order || order.customerId !== decoded.id) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 })
    }

    return Response.json({
      message: "Order detail",
      order,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
