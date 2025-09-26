// app/api/voucher/add-voucher/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

// ===== CORS (reflect allowlist) =====
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,        // ex: https://frontend-mvp-phi.vercel.app
  process.env.FRONTEND_ORIGIN_LOCAL,  // ex: http://localhost:3001
].filter(Boolean);

function buildCors(req) {
  const origin = req.headers.get("origin");
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

// ---------- helpers ----------
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

async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

const asInt = (v, d = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};
const asDecimalString = (v, d = "0") => {
  if (v === undefined || v === null || v === "") return d;
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : d;
};

export async function POST(req) {
  const cors = buildCors(req);
  try {
    // ---- auth ----
    const token = getToken(req);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: cors,
      });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return new NextResponse(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: cors,
      });
    }

    // Wajib multipart
    const ctype = (req.headers.get("content-type") || "").toLowerCase();
    if (!ctype.includes("multipart/form-data")) {
      return new NextResponse(
        JSON.stringify({ error: "Content-Type must be multipart/form-data" }),
        { status: 400, headers: cors }
      );
    }

    const fd = await req.formData();
    const get = (k) => (fd.get(k)?.toString() ?? "").trim();

    // --- fields ---
    const title = get("title");
    const description = get("description");
    const code_voucher = get("code") || get("code_voucher") || "";
    const vendor_id = asInt(get("vendor_id") || payload.vendor_id);
    const category_voucher_id = asInt(get("category_voucher_id"));
    const inventory = asInt(get("inventory") || get("totalInventory") || 0);
    const price = asDecimalString(get("price") || "0");
    const weight = asDecimalString(get("weight") || "0");
    const dimension = get("dimension") || "";
    const status = asInt(get("status") || 1);
    const flag = asInt(get("flag") || 1);
    const voucher_start = get("startAt") || get("voucher_start");
    const voucher_end = get("endAt") || get("voucher_end");

    if (!title) {
      return new NextResponse(JSON.stringify({ error: "Title is required" }), {
        status: 400, headers: cors,
      });
    }
    if (!vendor_id) {
      return new NextResponse(JSON.stringify({ error: "vendor_id is required" }), {
        status: 400, headers: cors,
      });
    }

    const now = new Date();

    // ⚠️ Pastikan nama model sesuai schema:
    // - Jika model kamu `model ms_vouchers { ... }` => prisma.ms_vouchers
    // - Jika `model Voucher @@map("ms_vouchers")` => prisma.voucher
    const voucher = await prisma.ms_vouchers.create({
      data: {
        code_voucher: code_voucher || `VCH-${randomUUID()}`,
        vendor_id,
        category_voucher_id,
        title,
        description,
        inventory,
        price,     // Prisma Decimal aman terima string
        weight,
        dimension,
        status,
        flag,
        voucher_start: voucher_start ? new Date(voucher_start) : null,
        voucher_end: voucher_end ? new Date(voucher_end) : null,
        created_at: now,
        updated_at: now,
        created_by: payload.id ?? null,
        updated_by: payload.id ?? null,
      },
      select: { id: true, title: true },
    });

    // --- upload images (multiple) ---
    const files = fd.getAll("images");
    const savedImages = [];

    if (files && files.length) {
      // NOTE (Vercel): filesystem runtime read-only. Untuk production,
      // simpan ke Vercel Blob / S3 / Cloudinary.
      // Jika tetap butuh local, gunakan '/tmp' (ephemeral) hanya untuk preview.
      const baseDir =
        process.env.NODE_ENV === "production" ? "/tmp" : path.join(process.cwd(), "public");
      const uploadDir = path.join(baseDir, "uploads", "vouchers");
      await ensureDir(uploadDir);

      for (const file of files) {
        if (!(file instanceof File)) continue;
        if (file.size > 5 * 1024 * 1024) continue; // 5MB limit contoh

        const ext = path.extname(file.name || "").toLowerCase() || ".dat";
        const filename = `${voucher.id}-${randomUUID()}${ext}`;
        const filepath = path.join(uploadDir, filename);

        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(filepath, Buffer.from(arrayBuffer));

        // path publik:
        const publicPath =
          process.env.NODE_ENV === "production"
            ? `/uploads/vouchers/${filename}` // kalau pakai /tmp, ini tidak persist di Vercel
            : `/uploads/vouchers/${filename}`;

        const imgRow = await prisma.ms_vouchers_image.create({
          data: {
            voucher_id: voucher.id,
            image: publicPath,
            flag: 1,
            created_at: now,
            updated_at: now,
            created_by: payload.id ?? null,
            updated_by: payload.id ?? null,
          },
          select: { id: true, image: true },
        });

        savedImages.push(imgRow);
      }
    }

    return NextResponse.json(
      { message: "Voucher created", voucher: { id: voucher.id, title: voucher.title }, images: savedImages },
      { headers: cors }
    );
  } catch (err) {
    console.error(err);
    return new NextResponse(JSON.stringify({ error: err?.message ?? "Internal server error" }), {
      status: 500, headers: cors,
    });
  }
}
