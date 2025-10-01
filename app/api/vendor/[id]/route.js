// app/api/vendor/[id]/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

/* ========================= CORS ========================= */
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // ex: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // ex: http://localhost:3001
].filter(Boolean);

function buildCors(req, methods = "PATCH,PUT,OPTIONS") {
  const origin = req.headers.get("origin");
  const allow = ALLOWLIST.includes(origin) ? origin : (ALLOWLIST[0] || "*");
  const headers = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": methods,
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

/* ========================= Helpers ========================= */
const ROLE_BY_ID = { 1: "MEMBER", 2: "VENDOR", 3: "AFFILIATE", 4: "ADMIN", 5: "VENDOR" };
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function resolveRole(claims) {
  return (claims?.role ||
    ROLE_BY_ID[Number(claims?.role_id)] ||
    "GUEST").toString().toUpperCase();
}

/** Ambil subset field yang diizinkan dari body */
function pickUpdatableFields(body) {
  const allowed = [
    "name",
    "email",
    "address",
    "city",
    "province",
    "postal_code",
    "twitter",
    "instagram",
    "tiktok",
    "status",    // hanya ADMIN
    "flag",      // hanya ADMIN
    // "image"   // jika nanti anda dukung upload URL/file, bisa diaktifkan
  ];
  const data = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined) {
      data[k] = body[k];
    }
  }
  return data;
}

/* ========================= Core Update ========================= */
async function handleUpdate(req, { params }) {
  const cors = buildCors(req);
  try {
    const id = Number(params?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return new NextResponse(JSON.stringify({ error: "Invalid vendor id" }), { status: 400, headers: cors });
    }

    // --- Auth ---
    const token = getTokenFromRequest(req);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    let claims;
    try {
      claims = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
    }
    const requesterRole = resolveRole(claims);

    // --- Body & validation dasar ---
    let body;
    try {
      body = await req.json();
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: cors });
    }

    const incoming = pickUpdatableFields(body);

    // VENDOR tidak boleh mengubah status/flag
    if (requesterRole !== "ADMIN") {
      delete incoming.status;
      delete incoming.flag;
    }

    if (incoming.email && !emailRegex.test(incoming.email)) {
      return new NextResponse(JSON.stringify({ error: "Invalid email format" }), { status: 400, headers: cors });
    }

    // --- Ambil vendor target ---
    const vendor = await prisma.ms_vendor.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
        email: true,
        name: true,
        status: true,
      },
    });

    if (!vendor) {
      return new NextResponse(JSON.stringify({ error: "Vendor not found" }), { status: 404, headers: cors });
    }

    // --- Authorization ---
    // if (requesterRole === "ADMIN") {
    //   // boleh update apa pun
    // } else if (requesterRole === "VENDOR") {
    //   // vendor hanya boleh update vendornya sendiri
    //   if (Number(vendor.user_id) !== Number(claims.id)) {
    //     return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });
    //   }
    // } else {
    //   return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });
    // }

    // --- Jika email diganti, pastikan unik di users dan vendor lain ---
    if (incoming.email && incoming.email !== vendor.email) {
      const existedUser = await prisma.users.findUnique({
        where: { email: incoming.email },
        select: { id: true },
      });
      if (existedUser && Number(existedUser.id) !== Number(vendor.user_id)) {
        return new NextResponse(JSON.stringify({ error: "Email already in use" }), { status: 409, headers: cors });
      }
    }

    // --- Bangun data update vendor ---
    const vendorData = { ...incoming };
    if (vendorData.status !== undefined) vendorData.status = Number(vendorData.status);
    if (vendorData.flag !== undefined) vendorData.flag = Number(vendorData.flag);

    // --- Transaksi: update ms_vendor (+ sinkron users jika name/email berubah) ---
    const result = await prisma.$transaction(async (tx) => {
      const updatedVendor = await tx.ms_vendor.update({
        where: { id },
        data: vendorData,
      });

      // Sinkron user jika name/email disediakan
      const userPatch = {};
      if (incoming.name) userPatch.name = incoming.name;
      if (incoming.email) userPatch.email = incoming.email;

      let updatedUser = null;
      if (Object.keys(userPatch).length > 0) {
        updatedUser = await tx.users.update({
          where: { id: vendor.user_id },
          data: userPatch,
          select: { id: true, name: true, email: true, role_id: true, status: true },
        });
      }

      return { vendor: updatedVendor, user: updatedUser };
    });

    return new NextResponse(
      JSON.stringify({
        message: "Vendor updated",
        vendor: result.vendor,
        user: result.user, // bisa null jika tidak ada perubahan name/email
      }),
      { status: 200, headers: cors }
    );
  } catch (err) {
    const msg =
      err?.code === "P2002"
        ? `Duplicate value on unique field(s): ${Array.isArray(err?.meta?.target) ? err.meta.target.join(", ") : "unique"}`
        : err?.message || "Internal server error";
    return new NextResponse(JSON.stringify({ error: msg }), { status: 500, headers: cors });
  }
}

/* PATCH = partial update */
export async function PATCH(req, ctx) {
  return handleUpdate(req, ctx);
}

/* PUT = full/partial update (diterima sama seperti PATCH) */
export async function PUT(req, ctx) {
  return handleUpdate(req, ctx);
}
