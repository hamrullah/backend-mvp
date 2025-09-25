import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function POST(req, { params }) {
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
        JSON.stringify({ error: "Forbidden: Only Customer can pay orders" }),
        { status: 403 }
      )
    }

    const orderId = params.id
    const { gateway, txnId, status } = await req.json()

    // cek order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order || order.customerId !== decoded.id) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 })
    }

    if (order.paymentStatus === "PAID") {
      return new Response(JSON.stringify({ error: "Order already paid" }), { status: 400 })
    }

    // update status payment
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        gateway: gateway || "manual",
        txnId: txnId || `TXN-${Date.now()}`,
        paymentStatus: status || "PAID", // default success
      },
    })

    return Response.json({
      message: "Payment handled successfully",
      order: updatedOrder,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
