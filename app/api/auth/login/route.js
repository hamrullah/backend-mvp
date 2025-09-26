// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Whitelist FE
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // e.g. https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // e.g. http://localhost:3001 (dev)
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin");
  const allow = ALLOWLIST.includes(origin) ? origin : (ALLOWLIST[0] || "*");

  const headers = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });

  // Kalau pakai cookie/session, wajib bukan "*" dan aktifkan credentials:
  if (allow !== "*") headers.set("Access-Control-Allow-Credentials", "true");

  return headers;
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: buildCors(req) });
}

export async function POST(req) {
  const corsHeaders = buildCors(req);

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const email = body?.email ?? body?.username ?? null;
    const password = body?.password ?? body?.pass ?? null;
    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: corsHeaders }
      );
    }
    

    const user = await prisma.users.findFirst({
      where: { email },
      select: { id: true, email: true, name: true, role_id: true, password_hash: true },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404, headers: corsHeaders,
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash || "");
    if (!valid) {
      return new NextResponse(JSON.stringify({ error: "Invalid password" }), {
        status: 401, headers: corsHeaders,
      });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return new NextResponse(JSON.stringify({ error: "Missing NEXTAUTH_SECRET env" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const roleMap = { 1: "MEMBER", 2: "AFFILIATE", 3: "VENDOR", 4: "ADMIN" };
    const roleLabel = roleMap[user.role_id] || String(user.role_id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id, role: roleLabel },
      secret,
      { expiresIn: "1h" }
    );

    return NextResponse.json(
      {
        message: "Login success",
        token,
        user: { id: user.id, email: user.email, name: user.name, role_id: user.role_id, role: roleLabel },
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500,
      headers: buildCors(req),
    });
  }
}
