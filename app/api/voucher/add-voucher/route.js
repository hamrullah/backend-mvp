import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3001";
const corsHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

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
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (_) {}
}

function asInt(v, d = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}
function asDecimalString(v, d = "0") {
  if (v === undefined || v === null || v === "") return d;
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : d;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    // ---- auth (optional: perketat role vendor/admin) ----
    const token = getToken(req);
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

    // Wajib multipart (agar bisa upload file)
    const ctype = req.headers.get("content-type") || "";
    if (!ctype.toLowerCase().includes("multipart/form-data")) {
      return new NextResponse(
        JSON.stringify({ error: "Content-Type must be multipart/form-data" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const fd = await req.formData();
    const get = (k) => (fd.get(k)?.toString() ?? "").trim();

    // --- ambil field utama (sesuaikan nama kolom db kamu) ---
    const title = get("title");
    const description = get("description");
    const code_voucher = get("code") || get("code_voucher") || "";
    const vendor_id = asInt(get("vendor_id") || payload.vendor_id); // kalau vendor_id ada di token
    const category_voucher_id = asInt(get("category_voucher_id"));
    const inventory = asInt(get("inventory") || get("totalInventory") || 0);
    const price = asDecimalString(get("price") || "0");
    const weight = asDecimalString(get("weight") || "0");
    const dimension = get("dimension") || "";
    const status = asInt(get("status") || 1); // 1=published?
    const flag = asInt(get("flag") || 1);     // 1=aktif
    const voucher_start = get("startAt") || get("voucher_start");
    const voucher_end = get("endAt") || get("voucher_end");

    if (!title) {
      return new NextResponse(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (!vendor_id) {
      return new NextResponse(JSON.stringify({ error: "vendor_id is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // --- simpan voucher utama ---
    const now = new Date();

    // NOTE:
    // Jika di schema Prisma kamu model-nya bernama `ms_vouchers`, pakai `prisma.ms_vouchers`.
    // Kalau model kamu bernama `Voucher` (@@map("ms_vouchers")), ganti ke `prisma.voucher`.
    const voucher = await prisma.ms_vouchers.create({
      data: {
        code_voucher : code_voucher || `VCH-${randomUUID()}`,
        vendor_id,
        category_voucher_id,
        title,
        description,
        inventory,
        price,     // kirim string untuk kolom numeric/Decimal
        weight,    // string juga
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

    // --- simpan file gambar (multiple) ---
    const files = fd.getAll("images"); // name="images" multiple
    const savedImages = [];

    if (files && files.length) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "vouchers");
      await ensureDir(uploadDir);

      for (const file of files) {
        if (!(file instanceof File)) continue;
        // basic guard
        if (file.size > 5 * 1024 * 1024) continue; // 5MB limit contoh

        const ext = path.extname(file.name || "").toLowerCase() || ".dat";
        const filename = `${voucher.id}-${randomUUID()}${ext}`;
        const filepath = path.join(uploadDir, filename);

        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(filepath, Buffer.from(arrayBuffer));

        // path publik (served dari /public)
        const publicUrl = `/uploads/vouchers/${filename}`;

        // simpan ke tabel ms_vouchers_image
        const imgRow = await prisma.ms_vouchers_image.create({
          data: {
            voucher_id: voucher.id,
            image: publicUrl, // simpan path/URL
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
      {
        message: "Voucher created",
        voucher: { id: voucher.id, title: voucher.title },
        images: savedImages,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error(err);
    return new NextResponse(
      JSON.stringify({ error: err?.message ?? "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
}
