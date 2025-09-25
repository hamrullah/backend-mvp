import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req) {
  try {
    const {
      name,
      email,
      password,
      address,
      city,
      province,
      postal_code,
      image,
      twitter,
      instagram,
      tiktok,
    } = await req.json()

    // validasi sederhana
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Name, email, and password are required" }),
        { status: 400 }
      )
    }

    // cek apakah email users sudah ada
    const existing = await prisma.users.findUnique({ where: { email } })
    if (existing) {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    // buat user admin (role_id = 1)
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password_hash: hashed,
        role_id: 4, // pastikan ms_role dengan id=1 adalah Admin
      },
    })

    // buat ms_admin terkait
    const admin = await prisma.ms_admin.create({
      data: {
        code_admin: `ADM-${Date.now()}`,
        name_admin: name,
        email,
        address: address ?? null,
        city: city ?? null,
        province: province ?? null,
        postal_code: postal_code ?? null,
        image: image ?? null,
        twitter: twitter ?? null,
        instagram: instagram ?? null,
        tiktok: tiktok ?? null,
        user_id: user.id,
      },
    })

    return new Response(
      JSON.stringify({
        message: "Admin registered successfully",
        user: {
          id: user.id,
          email: user.email,
          role_id: user.role_id,
        },
        admin,
      }),
      { status: 201 }
    )
  } catch (err) {
    // tangani unique constraint error Prisma (opsional)
    if (err?.code === "P2002") {
      return new Response(
        JSON.stringify({ error: `Duplicate field: ${err.meta?.target?.join(", ")}` }),
        { status: 400 }
      )
    }
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
    })
  }
}
