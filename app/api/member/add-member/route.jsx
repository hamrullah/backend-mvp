// app/api/member/add-member/route.js
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { customAlphabet } from "nanoid"

// ====== CORS ======
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // ganti ke origin FE saat production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

// ====== helpers ======
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6)
const codeMember = () => `MB-${nanoid()}`
const toStrOrNull = (v) => (v === undefined || v === null ? null : String(v))

export async function POST(req) {
  try {
    const body = await req.json()

    const {
      // wajib:
      name_member,
      email,
      referral_code, // kode referal affiliate

      // opsional (alamat & medsos):
      address,
      city,
      province,
      postal_code,
      twitter,
      instagram,
      tiktok,

      // opsional: besaran komisi awal (default 0)
      commission,
    } = body || {}

    // Validasi minimal
    if (!name_member || !email || !referral_code) {
      return new Response(
        JSON.stringify({ error: "name_member, email, dan referral_code wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      )
    }

    // Cari affiliate berdasar referral_code
    const affiliate = await prisma.ms_affiliate.findFirst({
      where: { referral_code: referral_code },
      select: { id: true, code_affiliate: true, name_affiliate: true, status: true },
    })
    if (!affiliate) {
      return new Response(
        JSON.stringify({ error: "Referral code tidak ditemukan" }),
        { status: 404, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      )
    }
    if (Number(affiliate.status) === 0) {
      return new Response(
        JSON.stringify({ error: "Affiliate sedang non-aktif" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      )
    }

    // Cek email bentrok (users atau ms_member)
    const existingUser = await prisma.users.findUnique({ where: { email } })
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Email sudah terdaftar" }),
        { status: 409, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      )
    }

    const hashed = await bcrypt.hash("12345", 10)
    const memberCode = codeMember()
    const commissionAmount =
      commission === undefined || commission === null ? "0.00" : String(commission)

    // Jalankan atomik
    const result = await prisma.$transaction(async (tx) => {
      // 1) Buat user
      const user = await tx.users.create({
        data: {
          name: name_member,
          email,
          password_hash: hashed,
          status: 1,
          // role_id opsional — isi jika kamu punya master role
        },
        select: { id: true, name: true, email: true },
      })

      // 2) Buat member
      const member = await tx.ms_member.create({
        data: {
          code_member: memberCode,
          name_member,
          email,
          address: toStrOrNull(address) || "",
          city: toStrOrNull(city) || "",
          province: toStrOrNull(province) || "",
          postal_code: toStrOrNull(postal_code) || "",
          twitter: toStrOrNull(twitter),
          instagram: toStrOrNull(instagram),
          tiktok: toStrOrNull(tiktok),
          user_id: user.id,
          status: 1,
          flag: 1,
          affiliate_id: affiliate.id,
        },
        include: {
          affiliate: { select: { id: true, code_affiliate: true, name_affiliate: true } },
        },
      })

      // 3) Insert affiliate_commision (ejaan sesuai schema)
      await tx.affiliate_commision.create({
        data: {
          affilate_id: affiliate.id,           // per schema typo
          member_id: member.id,
          commision: commissionAmount,         // Decimal(12,2) — kirim string OK
          status: 1,
          flag: 1,
        },
      })

      return { user, member }
    })

    const payload = {
      message: "Member registered",
      password_note: "Default password adalah 12345. Harap diganti setelah login.",
      data: {
        ...result.member,
        user: result.user,
      },
    }

    return new Response(JSON.stringify(payload), {
      status: 201,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    })
  } catch (err) {
    console.error("add-member error:", err)
    // Tangani unique constraint prisma
    if (err?.code === "P2002") {
      return new Response(JSON.stringify({ error: "Data sudah ada / duplikat" }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      })
    }
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    })
  }
}
