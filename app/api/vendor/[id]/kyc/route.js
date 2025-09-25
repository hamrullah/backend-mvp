import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

export async function PATCH(req, { params }) {
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
        JSON.stringify({ error: "Forbidden: Only Admin can update KYC" }),
        { status: 403 }
      )
    }

    const { id } = params
    const { status } = await req.json()

    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid KYC status" }), { status: 400 })
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { kycStatus: status },
    })

    return Response.json({
      message: "Vendor KYC status updated successfully",
      vendor,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
