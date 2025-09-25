import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    // cari user dengan role Customer
    const user = await prisma.user.findFirst({
      where: { email, role: "Customer" },
    })

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Customer not found" }),
        { status: 404 }
      )
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Invalid password" }),
        { status: 401 }
      )
    }

    // generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: "1h" }
    )

    return Response.json({
      message: "Login success",
      token,
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
