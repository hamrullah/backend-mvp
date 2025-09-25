import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

// ====== CORS ======
const ORIGIN = "http://localhost:3001"; // origin FE kamu
const corsHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
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

// ====== LIST VENDOR ======
export async function GET(req) {
  try {
    // ---- Auth (Bearer) ----
    const token = getTokenFromRequest(req);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    // (opsional) batasi role:
    // if ((payload.role || "").toUpperCase() !== "ADMIN") {
    //   return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    // }

    // ---- Query params ----
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));
    const q = (searchParams.get("q") || "").trim();
    const statusParam = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const where = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { code_vendor: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { province: { contains: q, mode: "insensitive" } },
      ];
    }
    if (statusParam !== null && statusParam !== undefined && statusParam !== "") {
      where.status = Number(statusParam);
    }

    // ⚠️ Pastikan nama model prisma sesuai schema kamu.
    // Kalau model-nya `model ms_vendor { ... }` maka pakai `prisma.ms_vendor`.
    // Jika model kamu bernama `Vendor`, ganti ke `prisma.vendor`.
    const [rows, total] = await Promise.all([
      prisma.ms_vendor.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        take: limit,
        skip: offset,
        select: {
          id: true,
          code_vendor: true,
          name: true,
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
        },
      }),
      prisma.ms_vendor.count({ where }),
    ]);

    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
    const vendors = rows.map((v) => ({
      ...v,
      image_url: v.image ? (v.image.startsWith("http") ? v.image : `${base}${v.image}`) : null,
    }));

    return new NextResponse(
      JSON.stringify({
        message: "Vendor list",
        pagination: { total, limit, offset },
        vendors,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
