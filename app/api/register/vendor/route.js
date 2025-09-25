import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req) {
  try {
    const { name, email, password, storeName, bankAccount, settlementTerms } =
      await req.json()

    // cek apakah email sudah dipakai
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        { status: 400 }
      )
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10)

    // buat user vendor
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "Vendor",
      },
    })

    // buat vendor record
    const vendor = await prisma.vendor.create({
      data: {
        ownerUserId: user.id,
        storeName,
        kycStatus: "PENDING", // default
        bankAccount: bankAccount || null, // tipe Json?
        settlementTerms: settlementTerms || null,
      },
    })

    return Response.json({
      message: "Vendor registered successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      vendor,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
