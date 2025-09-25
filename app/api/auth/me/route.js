// app/api/auth/me/route.js
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

// jsonwebtoken butuh Node runtime
export const runtime = "nodejs"
// opsional: jangan cache di edge
export const dynamic = "force-dynamic"

// Origin yang diizinkan
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  process.env.NEXT_PUBLIC_WEB_ORIGIN || "",
])

function buildCorsHeaders(origin) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  })
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin)
  }
  return headers
}

function getTokenFromRequest(req) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization")
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7)

  const cookie = req.headers.get("cookie")
  if (cookie) {
    const m = cookie.match(/(?:^|;)\s*token=([^;]+)/)
    if (m) return decodeURIComponent(m[1])
  }
  return null
}

export async function OPTIONS(req) {
  const origin = req.headers.get("origin") || ""
  const headers = buildCorsHeaders(origin)
  return new NextResponse(null, { status: 204, headers })
}

export async function GET(req) {
  const origin = req.headers.get("origin") || ""
  const headers = buildCorsHeaders(origin)

  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401, headers })
    }

    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.json({ error: "Missing NEXTAUTH_SECRET env" }, { status: 500, headers })
    }

    let payload
    try {
      payload = jwt.verify(token, secret)
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401, headers })
    }

    // Sesuaikan skema Prisma kamu
    const user = await prisma.users.findUnique({
      where: { id: payload.id },
      include: { role: true, admin: true, vendor: true, affiliate: true, member: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404, headers })
    }

    // Tentukan profileType & profile
    let profileType = null
    let profile = null
    if (user.admin)        { profileType = "Admin";     profile = user.admin }
    else if (user.vendor)  { profileType = "Vendor";    profile = user.vendor }
    else if (user.affiliate){ profileType = "Affiliate"; profile = user.affiliate }
    else if (user.member)  { profileType = "Member";    profile = user.member }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        role: user.role?.name_role ?? payload.role,
      },
      profileType,
      profile,
    }, { headers })
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500, headers }
    )
  }
}
