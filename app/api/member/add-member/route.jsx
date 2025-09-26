// app/api/member/add-member/route.js
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

// ====== CORS (reflect allowlist) ======
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // contoh: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // contoh: http://localhost:3001
  "http://localhost:3001",            // fallback dev
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin");
  const allow = ALLOWLIST.includes(origin) ? origin : (ALLOWLIST[0] || "*");
  const headers = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json",
  });
  if (allow !== "*") headers.set("Access-Control-Allow-Credentials", "true");
  return headers;
}

export async function OPTIONS(req) {
  return new Response(null, { status: 204, headers: buildCors(req) });
}

// ====== helpers ======
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const codeMember = () => `MB-${nanoid()}`;
const toStrOrNull = (v) => (v === undefined || v === null ? null : String(v));
const DEFAULT_PASSWORD = "12345";
const MEMBER_ROLE_ID = Number(process.env.MEMBER_ROLE_ID || 1);
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ""));

export async function POST(req) {
  const cors = buildCors(req);
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: cors });
    }

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
    } = body || {};

    // Validasi minimal
    if (!name_member || !email || !referral_code) {
      return new Response(
        JSON.stringify({ error: "name_member, email, dan referral_code wajib diisi" }),
        { status: 400, headers: cors }
      );
    }
    if (!isEmail(email)) {
      return new Response(JSON.stringify({ error: "Format email tidak valid" }), {
        status: 400, headers: cors,
      });
    }

    const commissionNum = Number(commission ?? 0);
    if (!Number.isFinite(commissionNum) || commissionNum < 0) {
      return new Response(JSON.stringify({ error: "commission harus angka ≥ 0" }), {
        status: 400, headers: cors,
      });
    }
    const commissionAmount = commissionNum.toFixed(2); // kirim sebagai string ke Decimal

    // Cari affiliate berdasar referral_code
    const affiliate = await prisma.ms_affiliate.findFirst({
      where: { referral_code },
      select: { id: true, code_affiliate: true, name_affiliate: true, status: true },
    });
    if (!affiliate) {
      return new Response(JSON.stringify({ error: "Referral code tidak ditemukan" }), {
        status: 404, headers: cors,
      });
    }
    if (Number(affiliate.status) === 0) {
      return new Response(JSON.stringify({ error: "Affiliate sedang non-aktif" }), {
        status: 400, headers: cors,
      });
    }

    // Cek email sudah dipakai user lain
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email sudah terdaftar" }), {
        status: 409, headers: cors,
      });
    }

    const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    const memberCode = codeMember();

    // Transaksi atomik: users + ms_member + affiliate_commision
    const result = await prisma.$transaction(async (tx) => {
      // 1) Buat user
      const user = await tx.users.create({
        data: {
          name: name_member,
          email,
          password_hash,
          role_id: 7, // sesuaikan bila mapping role berbeda
          status: 1,
        },
        select: { id: true, name: true, email: true, role_id: true },
      });

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
      });

      // 3) Insert affiliate_commision (per ejaan schema: affilate_id, commision)
      await tx.affiliate_commision.create({
        data: {
          affilate_id: affiliate.id,  // ejaan schema
          member_id: member.id,
          commision: commissionAmount,
          status: 1,
          flag: 1,
        },
      });

      return { user, member };
    });

    const payload = {
      message: "Member registered",
      password_note: "Default password adalah 12345. Harap diganti setelah login.",
      data: {
        ...result.member,
        user: result.user,
      },
    };

    return new Response(JSON.stringify(payload), { status: 201, headers: cors });
  } catch (err) {
    console.error("add-member error:", err);
    // Tangani unique constraint prisma
    if (err?.code === "P2002") {
      return new Response(JSON.stringify({ error: "Data sudah ada / duplikat" }), {
        status: 409, headers: cors,
      });
    }
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: cors,
    });
  }
}
