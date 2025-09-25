import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function PATCH(req, { params }) {
  try {
    const { id } = params // voucherId dari URL
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

    if (decoded.role !== "Vendor") {
      return new Response(JSON.stringify({ error: "Forbidden: Only vendors can update voucher status" }), { status: 403 })
    }

    const vendor = await prisma.vendor.findUnique({
      where: { ownerUserId: decoded.id },
    })
    if (!vendor) {
      return new Response(JSON.stringify({ error: "Vendor profile not found" }), { status: 404 })
    }

    const existingVoucher = await prisma.voucher.findUnique({ where: { id } })
    if (!existingVoucher || existingVoucher.vendorId !== vendor.id) {
      return new Response(JSON.stringify({ error: "Voucher not found or not yours" }), { status: 404 })
    }

    const { status } = await req.json()
    if (!status) {
      return new Response(JSON.stringify({ error: "Missing status field" }), { status: 400 })
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: { status },
    })

    return Response.json({
      message: "Voucher status updated successfully",
      voucher: updated,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
