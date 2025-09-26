// app/api/category/add-category/route.js
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

/** CORS helper sama seperti list */
const ALLOWLIST = [
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_ORIGIN_LOCAL,
  "http://localhost:3001",
].filter(Boolean);
function cors(req) {
  const o = req.headers.get("origin") || "";
  const allow = ALLOWLIST.includes(o) ? o : ALLOWLIST[0] || "*";
  const h = new Headers({
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });
  if (allow !== "*") h.set("Access-Control-Allow-Credentials", "true");
  return h;
}
export async function OPTIONS(req) {
  return new Response(null, { status: 204, headers: cors(req) });
}

/** ---------- POST /api/category/add-category ---------- */
export async function POST(req) {
  const headers = cors(req);
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }
    let payload;
    try {
      payload = jwt.verify(auth.slice(7), process.env.NEXTAUTH_SECRET);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.category_name || "").trim();
    const status = Number.isInteger(body.status) ? Number(body.status) : 1;

    if (!name) {
      return new Response(JSON.stringify({ error: "category_name wajib diisi" }), {
        status: 400,
        headers,
      });
    }

    const now = new Date();
    const created = await prisma.category_vouchers.create({
      data: {
        category_name: name,
        status,
        created_at: now,
        updated_at: now,
        created_by: payload?.id ?? null,
        updated_by: payload?.id ?? null,
      },
      select: {
        id: true,
        category_name: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    return new Response(
      JSON.stringify({ message: "Category created", data: created }),
      { status: 201, headers: { ...headers, "Content-Type": "application/json" } },
    );
  } catch (err) {
    // Prisma unique error (kalau ada constraint)
    if (err?.code === "P2002") {
      return new Response(JSON.stringify({ error: "Category sudah ada" }), {
        status: 409,
        headers,
      });
    }
    return new Response(JSON.stringify({ error: err?.message ?? "Internal error" }), {
      status: 500,
      headers,
    });
  }
}
