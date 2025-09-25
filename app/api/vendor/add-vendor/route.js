import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// ==== CORS ====
const ORIGIN = "http://localhost:3001";
const corsHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// ==== Helpers ====
const DEFAULT_PASSWORD = "12345";
const VENDOR_ROLE_ID = Number(process.env.VENDOR_ROLE_ID || 2); // sesuaikan role vendor di project kamu
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const json = (data, init = {}) =>
  new NextResponse(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...(init.headers || {}) },
  });

const genCodeVendor = (prefix = "V") =>
  `${prefix}${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now()
    .toString()
    .slice(-2)}`;

// ==== POST /api/vendor/register ====
export async function POST(req) {
  try {
    const body = await req.json();
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
      code_vendor,  // opsional; kalau kosong akan digenerate
      status = 1,
      flag = 1,
    } = body || {};

    if (!name || !email) {
      return json({ error: "Name dan email wajib diisi" }, { status: 400 });
    }

    // Cek user by email
    const existed = await prisma.users.findUnique({ where: { email } });
    if (existed) {
      return json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    // Hash default password
    const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // Buat user
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password_hash,
        role_id: 5,
        status: 1,
      },
      select: { id: true, name: true, email: true, role_id: true, status: true },
    });

    // Buat vendor (relasi ke users.id)
    const vendor = await prisma.ms_vendor.create({
      data: {
        code_vendor: code_vendor || genCodeVendor("V"),
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

    return json({
      message: "Vendor registered",
      user,
      vendor,
      password_note:
        "Akun dibuat dengan password default '12345'. Harap ubah password setelah login.",
    });
  } catch (err) {
    // Tangani unique constraint dll
    const msg =
      err?.code === "P2002"
        ? `Duplikat data pada field: ${err?.meta?.target?.join(", ")}`
        : err?.message || "Internal server error";

    return json({ error: msg }, { status: 500 });
  }
}
