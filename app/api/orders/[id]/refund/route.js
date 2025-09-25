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

    if (decoded.role !== "Admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only Admin can refund orders" }),
        { status: 403 }
      )
    }

    const { id } = params

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 })
    }

    if (order.paymentStatus === "REFUNDED") {
      return new Response(JSON.stringify({ error: "Order already refunded" }), { status: 400 })
    }

    // update payment status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { paymentStatus: "REFUNDED" },
    })

    // optional: create vendorPayables refund
    for (const item of order.items) {
      await prisma.vendorPayable.updateMany({
        where: { orderId: order.id, vendorId: item.voucher.vendorId },
        data: { status: "REFUNDED" },
      })
    }

    return Response.json({
      message: "Order refunded successfully",
      order: updatedOrder,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
