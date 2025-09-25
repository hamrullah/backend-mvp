// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ORIGIN = process.env.APP_ORIGIN || "https://backend-mvp-nine.vercel.app";
const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  Vary: "Origin",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: cors,
      });
    }

    // Terima email atau username sebagai email
    const email = body?.email ?? body?.username ?? null;
    const password = body?.password ?? body?.pass ?? null;
    console.log("pass", password);
    console.log("email", email);
    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: cors }
      );
    }

    // Tabel kamu = users, kolom password_hash & role_id
    const user = await prisma.users.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role_id: true,
        password_hash: true,
      },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: cors,
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash || "");
    if (!valid) {
      return new NextResponse(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: cors,
      });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return new NextResponse(
        JSON.stringify({ error: "Missing NEXTAUTH_SECRET env" }),
        { status: 500, headers: cors }
      );
    }

    // Optional: map role_id ke label
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
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role_id: user.role_id,
          role: roleLabel,
        },
      },
      { headers: cors }
    );
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ error: err?.message ?? "Internal server error" }),
      { status: 500, headers: cors }
    );
  }
}
