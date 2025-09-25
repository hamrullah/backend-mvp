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
        JSON.stringify({ error: "Forbidden: Only Customer can view voucher" }),
        { status: 403 }
      )
    }

    // ambil voucher by id
    const voucher = await prisma.voucher.findUnique({
      where: { id: params.id },
      include: {
        vendor: { select: { id: true, storeName: true } },
      },
    })

    if (!voucher) {
      return new Response(JSON.stringify({ error: "Voucher not found" }), { status: 404 })
    }

    return Response.json({
      message: "Voucher detail",
      voucher,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
