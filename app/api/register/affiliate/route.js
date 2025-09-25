import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req) {
  try {
    const { name, email, password, code, commissionRate, bankAccount } =
      await req.json()

    // cek apakah email sudah ada
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    // buat user affiliate
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "Affiliate",
      },
    })

    // buat affiliate
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: user.id,
        code: code || `AFF-${Date.now()}`,
        commissionRate: commissionRate || 10.0,
        bankAccount: bankAccount || null,
      },
    })

    return Response.json({
      message: "Affiliate registered successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      affiliate,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
