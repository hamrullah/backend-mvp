// app/api/affiliate/register/route.js
import prisma from "@/lib/prisma"
import { customAlphabet } from "nanoid"
import bcrypt from "bcryptjs"

// ===== CORS =====
const cors = {
  "Access-Control-Allow-Origin": "*", // ganti ke origin FE di prod
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

// ===== Utils =====
const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6)
const genAffiliateCode = () => `AF-${nano()}`
const genReferral = () => `REF${nano()}`
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim())

export async function POST(req) {
  try {
    const body = await req.json()

    const {
      name_affiliate,
      email,
      address = "",
      city = "",
      province = "",
      postal_code = "",
      image = null,
      twitter = null,
      instagram = null,
      tiktok = null,
      referral_code,       // opsional; kalau tidak ada akan digenerate
      code_affiliate,      // opsional; kalau tidak ada akan digenerate
      status = 1,          // default aktif
      flag = 1,
    } = body || {}

    // ---- validation
    if (!name_affiliate || !String(name_affiliate).trim()) {
      return Response.json({ error: "name_affiliate wajib diisi" }, { status: 400, headers: cors })
    }
    if (!email || !isEmail(email)) {
      return Response.json({ error: "email wajib dan harus valid" }, { status: 400, headers: cors })
    }

    // Cek duplikasi email (users & ms_affiliate)
    const [userExist, affExist] = await Promise.all([
      prisma.users.findUnique({ where: { email } }),
      prisma.ms_affiliate.findUnique({ where: { email } }),
    ])
    if (userExist || affExist) {
      return Response.json({ error: "Email sudah terdaftar" }, { status: 409, headers: cors })
    }

    // Persiapan data
    const passwordHash = await bcrypt.hash("12345", 10)
    let code = code_affiliate || genAffiliateCode()
    let ref = referral_code || genReferral()

    // Jaga2 collision unik untuk code/referral (jarang, tapi aman)
    // regenerate sampai unik (maks 5x)
    for (let i = 0; i < 5; i++) {
      // cek pair secara paralel
      // NB: gunakan findFirst + OR kecil agar hemat roundtrip
      //   - code_affiliate unik
      //   - referral_code unik
      //   - email sudah dicek di atas
      const [codeClash, refClash] = await Promise.all([
        prisma.ms_affiliate.findFirst({ where: { code_affiliate: code } }),
        prisma.ms_affiliate.findFirst({ where: { referral_code: ref } }),
      ])
      if (!codeClash && !refClash) break
      if (codeClash) code = genAffiliateCode()
      if (refClash) ref = genReferral()
    }

    // ==== TRANSAKSI ====
    const created = await prisma.$transaction(async (tx) => {
      // (opsional) ambil role Affiliate jika ada
      let roleId = null
      try {
        const role = await tx.ms_role.findFirst({
          where: { OR: [{ code_role: "AFFILIATE" }, { name_role: "Affiliate" }] },
          select: { id: true },
        })
        roleId = role?.id ?? null
      } catch (_) {}

      // 1) create user
      const user = await tx.users.create({
        data: {
          name: name_affiliate,
          email,
          password_hash: passwordHash,
          role_id: roleId,
          status: 1,
        },
        select: { id: true, name: true, email: true },
      })

      // 2) create affiliate
      const aff = await tx.ms_affiliate.create({
        data: {
          code_affiliate: code,
          name_affiliate,
          email,
          address,
          city,
          province,
          postal_code,
          image,
          twitter,
          instagram,
          tiktok,
          user_id: user.id,
          status: Number(status),
          flag: Number(flag),
          referral_code: ref,
        },
        select: {
          id: true,
          code_affiliate: true,
          name_affiliate: true,
          email: true,
          address: true,
          city: true,
          province: true,
          postal_code: true,
          image: true,
          twitter: true,
          instagram: true,
          tiktok: true,
          user_id: true,
          status: true,
          flag: true,
          created_at: true,
          updated_at: true,
          referral_code: true,
        },
      })

      return { user, affiliate: aff }
    })

    return new Response(
      JSON.stringify({
        message: "Affiliate registered",
        password_note: "Default password adalah 12345. Harap diganti setelah login.",
        data: {
          ...created.affiliate,
          user: created.user,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json", ...cors } },
    )
  } catch (err) {
    // Prisma unique error
    if (err?.code === "P2002") {
      return new Response(JSON.stringify({ error: "Data unik sudah ada (email/kode/referral)" }), {
        status: 409,
        headers: cors,
      })
    }
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: cors,
    })
  }
}
