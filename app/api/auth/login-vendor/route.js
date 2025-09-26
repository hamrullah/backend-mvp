// app/api/auth/vendor-login/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ===== CORS (reflect by allowlist) =====
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // contoh: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // contoh: http://localhost:3001
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
  return new NextResponse(null, { status: 204, headers: buildCors(req) });
}

export async function POST(req) {
  const cors = buildCors(req);
  try {
    // --- parse body
    let body;
    try {
      body = await req.json();
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: cors });
    }

    const email = body?.email ?? body?.username;
    const password = body?.password ?? body?.pass;

    if (!email || !password) {
      return new NextResponse(JSON.stringify({ error: "Email and password are required" }), { status: 400, headers: cors });
    }

    // --- ambil user + relasi vendor (gunakan model `users` + field `password_hash`)
    const user = await prisma.users.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role_id: true,
        password_hash: true,
        vendor: { select: { id: true, status: true, code_vendor: true, name: true } },
      },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Vendor not found" }), { status: 404, headers: cors });
    }

    if (!user.vendor) {
      return new NextResponse(JSON.stringify({ error: "Vendor profile is missing" }), { status: 403, headers: cors });
    }
    if (Number(user.vendor.status) === 0) {
      return new NextResponse(JSON.stringify({ error: "Vendor is suspended" }), { status: 403, headers: cors });
    }

    // --- verifikasi password (hash ada di password_hash)
    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) {
      return new NextResponse(JSON.stringify({ error: "Invalid password" }), { status: 401, headers: cors });
    }

    // --- siapkan JWT
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return new NextResponse(JSON.stringify({ error: "Missing NEXTAUTH_SECRET env" }), { status: 500, headers: cors });
    }

    // role_id → label (opsional, sesuaikan mapping kamu)
    const roleMap = { 1: "MEMBER", 2: "AFFILIATE", 3: "VENDOR", 4: "ADMIN", 5: "VENDOR" };
    const roleLabel = roleMap[user.role_id] || "VENDOR";

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role: roleLabel,
        vendor_id: user.vendor.id,
      },
      secret,
      { expiresIn: "1h" }
    );

    return NextResponse.json(
      {
        message: "Login success",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role_id: user.role_id,
          role: roleLabel,
        },
        vendor: {
          id: user.vendor.id,
          code_vendor: user.vendor.code_vendor,
          name: user.vendor.name,
          status: user.vendor.status,
        },
      },
      { headers: cors }
    );
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500,
      headers: cors,
    });
  }
}
