import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req) {
  try {
    const { name, email, password } = await req.json()

    // cek apakah email sudah ada
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    // buat user customer
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "Customer",
      },
    })

    // insert ke Account
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: user.id, // pakai user.id sebagai identifier
      },
    })

    return Response.json({
      message: "Customer registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
