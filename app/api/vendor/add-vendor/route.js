import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// ========== CORS (reflect allowlist) ==========
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // ex: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // ex: http://localhost:3001 (dev)
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
  return new NextResponse(null, { status: 204, headers: buildCors(req) });
}

// ========== Helpers ==========
const DEFAULT_PASSWORD = "12345";
const VENDOR_ROLE_ID = Number(process.env.VENDOR_ROLE_ID || 3); // default 3 = Vendor
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function genCodeVendor(prefix = "V") {
  return `${prefix}${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now()
    .toString()
    .slice(-2)}`;
}

// ========== POST /api/vendor/register ==========
export async function POST(req) {
  const cors = buildCors(req);
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: cors });
    }

    const {
      name,
      email,
      address = "",
      city = "",
      province = "",
      postal_code = "",
      twitter = null,
      instagram = null,
      tiktok = null,
      code_vendor, // optional
      status = 1,
      flag = 1,
    } = body || {};

    if (!name || !email) {
      return new NextResponse(JSON.stringify({ error: "Name dan email wajib diisi" }), { status: 400, headers: cors });
    }
    if (!emailRegex.test(email)) {
      return new NextResponse(JSON.stringify({ error: "Format email tidak valid" }), { status: 400, headers: cors });
    }

    // Pastikan email belum dipakai
    const existed = await prisma.users.findUnique({ where: { email } });
    if (existed) {
      return new NextResponse(JSON.stringify({ error: "Email sudah terdaftar" }), { status: 409, headers: cors });
    }

    // Hash password default
    const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // Transaksi: buat user + vendor atomically
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          name,
          email,
          password_hash,
          role_id: 5,
          status: 1,
        },
        select: { id: true, name: true, email: true, role_id: true, status: true },
      });

      // generate code_vendor (coba ulang jika tabrakan unik)
      let finalCode = code_vendor || genCodeVendor("V");
      if (code_vendor == null) {
        for (let i = 0; i < 3; i++) {
          const dup = await tx.ms_vendor.findFirst({ where: { code_vendor: finalCode }, select: { id: true } });
          if (!dup) break;
          finalCode = genCodeVendor("V");
        }
      }

      const vendor = await tx.ms_vendor.create({
        data: {
          code_vendor: finalCode,
          name,
          email,
          address,
          city,
          province,
          postal_code,
          image: null,
          twitter,
          instagram,
          tiktok,
          user_id: user.id,
          status: Number(status),
          flag: Number(flag),
        },
      });

      return { user, vendor };
    });

    return new NextResponse(
      JSON.stringify({
        message: "Vendor registered",
        password_note: "Akun dibuat dengan password default '12345'. Harap ubah password setelah login.",
        user: result.user,
        vendor: result.vendor,
      }),
      { status: 200, headers: cors }
    );
  } catch (err) {
    const msg =
      err?.code === "P2002"
        ? `Duplikat data pada field: ${Array.isArray(err?.meta?.target) ? err.meta.target.join(", ") : "unik"}`
        : err?.message || "Internal server error";
    return new NextResponse(JSON.stringify({ error: msg }), { status: 500, headers: cors });
  }
}
