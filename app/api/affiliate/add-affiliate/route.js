// app/api/affiliate/register/route.js
import prisma from "@/lib/prisma";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";

// ===== CORS (allowlist & reflect Origin) =====
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // e.g. https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // e.g. http://localhost:3001
  "http://localhost:3001",
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin") || "";
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

// ===== Utils =====
const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const genAffiliateCode = () => `AF-${nano()}`;
const genReferral = () => `REF${nano()}`;
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());

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
      name_affiliate,
      email: rawEmail,
      address = "",
      city = "",
      province = "",
      postal_code = "",
      image = null,
      twitter = null,
      instagram = null,
      tiktok = null,
      referral_code,      // optional; auto-generate if missing
      code_affiliate,     // optional; auto-generate if missing
      status = 1,
      flag = 1,
    } = body || {};

    // ---- validation
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!name_affiliate || !String(name_affiliate).trim()) {
      return new Response(JSON.stringify({ error: "name_affiliate wajib diisi" }), { status: 400, headers: cors });
    }
    if (!email || !isEmail(email)) {
      return new Response(JSON.stringify({ error: "email wajib dan harus valid" }), { status: 400, headers: cors });
    }

    // Cek duplikasi email (users & ms_affiliate) — gunakan findFirst untuk aman
    const [userExist, affExist] = await Promise.all([
      prisma.users.findUnique({ where: { email } }),           // diasumsikan email unique di users
      prisma.ms_affiliate.findFirst({ where: { email } }),      // pakai findFirst (email mungkin tidak unique di schema)
    ]);
    if (userExist || affExist) {
      return new Response(JSON.stringify({ error: "Email sudah terdaftar" }), { status: 409, headers: cors });
    }

    // Persiapan data
    const passwordHash = await bcrypt.hash("12345", 10);
    let code = (code_affiliate || "").trim() || genAffiliateCode();
    let ref  = (referral_code || "").trim()  || genReferral();

    // Jaga2 collision unik untuk code/referral
    for (let i = 0; i < 5; i++) {
      const [codeClash, refClash] = await Promise.all([
        prisma.ms_affiliate.findFirst({ where: { code_affiliate: code } }),
        prisma.ms_affiliate.findFirst({ where: { referral_code: ref } }),
      ]);
      if (!codeClash && !refClash) break;
      if (codeClash) code = genAffiliateCode();
      if (refClash)  ref  = genReferral();
    }

    // (opsional) fallback role via env
    let roleId = null;
    try {
      const role = await prisma.ms_role.findFirst({
        where: { OR: [{ code_role: "AFFILIATE" }, { name_role: "Affiliate" }] },
        select: { id: true },
      });
      roleId = role?.id ?? (process.env.AFFILIATE_ROLE_ID ? Number(process.env.AFFILIATE_ROLE_ID) : null);
    } catch { /* ignore */ }

    // ==== TRANSAKSI ====
    const created = await prisma.$transaction(async (tx) => {
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
      });

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
      });

      return { user, affiliate: aff };
    });

    return new Response(
      JSON.stringify({
        message: "Affiliate registered",
        password_note: "Default password adalah 12345. Harap diganti setelah login.",
        data: { ...created.affiliate, user: created.user },
      }),
      { status: 201, headers: cors }
    );
  } catch (err) {
    // Prisma unique error
    if (err?.code === "P2002") {
      return new Response(JSON.stringify({ error: "Data unik sudah ada (email/kode/referral)" }), {
        status: 409, headers: buildCors(req),
      });
    }
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 500, headers: buildCors(req),
    });
  }
}
