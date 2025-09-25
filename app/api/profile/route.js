// app/api/auth/me/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// --- CORS util: pantulkan origin dari whitelist ---
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // ex: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // ex: http://localhost:3001 (opsional dev)
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin");
  const allow = ALLOWLIST.includes(origin) ? origin : (ALLOWLIST[0] || "*");

  const headers = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });

  // Hanya aktifkan credentials jika bukan "*"
  if (allow !== "*") headers.set("Access-Control-Allow-Credentials", "true");
  return headers;
}

function getTokenFromRequest(req) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7);
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const m = cookie.match(/(?:^|; )token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: buildCors(req) });
}

export async function GET(req) {
  const cors = buildCors(req);
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Missing token" }), { status: 401, headers: cors });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return new NextResponse(JSON.stringify({ error: "Missing NEXTAUTH_SECRET env" }), { status: 500, headers: cors });
    }

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: cors });
    }

    const user = await prisma.users.findUnique({
      where: { id: payload.id },
      include: { role: true, admin: true, vendor: true, affiliate: true, member: true },
    });
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), { status: 404, headers: cors });
    }

    let profileType = null, profile = null;
    if (user.admin) profileType = "ADMIN", (profile = user.admin);
    else if (user.vendor) profileType = "VENDOR", (profile = user.vendor);
    else if (user.affiliate) profileType = "AFFILIATE", (profile = user.affiliate);
    else if (user.member) profileType = "MEMBER", (profile = user.member);

    const roleName = user.role?.name_role || user.role?.name || payload.role || null;

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role_id: user.role_id ?? null, role: roleName },
      profileType,
      profile,
    }, { headers: cors });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500, headers: cors,
    });
  }
}
