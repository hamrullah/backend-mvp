// app/api/voucher/add/route.js
import { NextResponse } from "next/server";
import crypto, { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

/* ---------- CORS ---------- */
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_ORIGIN_LOCAL,
  "https://frontend-mvp-phi.vercel.app",
  "http://localhost:3001",
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin") || "";
  const allow = ALLOWLIST.includes(origin) ? origin : ALLOWLIST[0] || "*";
  const h = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Content-Type": "application/json",
  });
  if (allow !== "*") h.set("Access-Control-Allow-Credentials", "true");
  return h;
}

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: buildCors(req) });
}

/* ---------- Helpers (JANGAN di-export) ---------- */
function getToken(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (h && h.toLowerCase().startsWith("bearer ")) return h.slice(7);
  const c = req.headers.get("cookie");
  if (c) {
    const m = c.match(/(?:^|; )token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

const asInt = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : d;
};
const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

// 15 digit random (boleh leading zero)
function genDigits(n = 15) {
  const bytes = crypto.randomBytes(n);
  let out = "";
  for (let i = 0; i < n; i++) out += (bytes[i] % 10).toString(); // 0..9
  return out;
}

// Pastikan unik terhadap kolom unik ms_vouchers.code_voucher
async function generateUniqueVoucherCode(len = 15, maxTry = 10) {
  for (let i = 0; i < maxTry; i++) {
    const code = genDigits(len);
    const exists = await prisma.ms_vouchers.findUnique({
      where: { code_voucher: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("Failed to generate unique voucher code");
}

// Toggle kolom baru jika sudah migrate
const HAS_MONTHLY_LIMIT = process.env.HAS_MONTHLY_LIMIT === "1";

// Batas upload
const MAX_FILES = 10;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/* ---------- POST /api/voucher/add ---------- */
export async function POST(req) {
  const cors = buildCors(req);
  try {
    // Auth
    const token = getToken(req);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }
    try {
      jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
    }

    // Wajib multipart
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return new NextResponse(JSON.stringify({ error: "Content-Type must be multipart/form-data" }), {
        status: 400,
        headers: cors,
      });
    }

    const fd = await req.formData();
    const get = (k) => (fd.get(k)?.toString() ?? "").trim();

    const title = get("title");
    const vendor_id = asInt(get("vendor_id"));
    const category_voucher_id = asInt(get("category_voucher_id"));
    const inventory = asInt(get("inventory") || get("totalInventory") || 0);
    const price = money(get("price"));
    const startAt = get("startAt");
    const endAt = get("endAt");
    const description = get("description") || "";
    const monthly_usage_limit = asInt(get("monthly_usage_limit"), 0);

    if (!title) {
      return new NextResponse(JSON.stringify({ error: "Title is required" }), { status: 400, headers: cors });
    }
    if (!vendor_id) {
      return new NextResponse(JSON.stringify({ error: "vendor_id is required" }), { status: 400, headers: cors });
    }

    // Generate kode voucher 15 digit (unik)
    const code_voucher = await generateUniqueVoucherCode(15);

    const now = new Date();
    const data = {
      code_voucher,
      vendor_id,
      category_voucher_id,
      title,
      description,
      inventory,
      price, // Decimal -> string
      weight: "0.00",
      dimension: "",
      status: 1,
      flag: 1,
      voucher_start: startAt ? new Date(startAt) : null,
      voucher_end: endAt ? new Date(endAt) : null,
      created_at: now,
    };
    if (HAS_MONTHLY_LIMIT) data.monthly_usage_limit = monthly_usage_limit;

    const select = {
      id: true,
      code_voucher: true,
      title: true,
      vendor_id: true,
      category_voucher_id: true,
      inventory: true,
      price: true,
      voucher_start: true,
      voucher_end: true,
      created_at: true,
      ...(HAS_MONTHLY_LIMIT ? { monthly_usage_limit: true } : {}),
    };

    const voucher = await prisma.ms_vouchers.create({ data, select });

    // Upload multi image ke Vercel Blob
    const files = (fd.getAll("images") || []).filter(
      (f) => typeof f === "object" && f && "arrayBuffer" in f
    );

    const validFiles = files
      .slice(0, MAX_FILES)
      .filter((f) => f.type?.startsWith("image/"))
      .filter((f) => (f.size ?? 0) <= MAX_SIZE);

    const uploaded = [];
    for (const file of validFiles) {
      const name = file.name || `img-${randomUUID()}`;
      const ext = (name.split(".").pop() || "png").toLowerCase();
      const key = `vouchers/${voucher.id}-${randomUUID()}.${ext}`;

      // Perlu env: BLOB_READ_WRITE_TOKEN (Vercel) atau token lokal
      const { url } = await put(key, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type || "application/octet-stream",
      });

      const rec = await prisma.ms_vouchers_image.create({
        data: {
          voucher_id: voucher.id,
          image: url, // simpan URL public Blob
          flag: 1,
          created_at: new Date(),
        },
        select: { id: true, image: true, created_at: true, updated_at: true },
      });

      uploaded.push(rec);
    }

    return new NextResponse(
      JSON.stringify({ message: "Voucher created", voucher, images: uploaded }),
      { status: 201, headers: cors }
    );
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: cors,
    });
  }
}
