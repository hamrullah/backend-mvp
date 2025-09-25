// app/api/auth/me/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const ORIGIN = "https://backend-mvp-nine.vercel.app"; // ganti sesuai FE
const corsHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

function getTokenFromRequest(req) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7);

  const cookie = req.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|; )token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req) {
  try {
    // 1) Ambil token
    const token = getTokenFromRequest(req);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Missing token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 2) Verify token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return new NextResponse(JSON.stringify({ error: "Missing NEXTAUTH_SECRET env" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 3) Ambil user + relasi (sesuaikan nama model prisma Anda: users vs user)
    const user = await prisma.users.findUnique({
      where: { id: payload.id },
      include: {
        role: true,
        admin: true,
        vendor: true,
        affiliate: true,
        member: true,
      },
    });
    // Jika model Anda bernama `user`, pakai:
    // const user = await prisma.user.findUnique({ where: { id: payload.id }, include: { ... } });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // 4) Tentukan profileType & profile aktif
    let profileType = null;
    let profile = null;
    if (user.admin) profileType = "Admin", (profile = user.admin);
    else if (user.vendor) profileType = "Vendor", (profile = user.vendor);
    else if (user.affiliate) profileType = "Affiliate", (profile = user.affiliate);
    else if (user.member) profileType = "Member", (profile = user.member);

    // 5) Nama role
    const roleName = user.role?.name_role || user.role?.name || payload.role || null;

    // 6) Response ke FE
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role_id: user.role_id ?? null,
          role: roleName,
        },
        profileType,
        profile,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ error: err?.message ?? "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
}
