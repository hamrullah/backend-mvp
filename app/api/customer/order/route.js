import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const ORIGIN = "http://localhost:3001"; // origin React dev
const corsHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  // wajib: jawab preflight
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.slice(7), process.env.NEXTAUTH_SECRET);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
    }

    // case-insensitive: token kamu sebelumnya sering lowercase
    if ((decoded.role || "").toLowerCase() !== "customer") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only Customer can view orders" }),
        { status: 403, headers: corsHeaders }
      );
    }

    const total = await prisma.order.count({ where: { customerId: decoded.id } });

    const orders = await prisma.order.findMany({
      where: { customerId: decoded.id },
      include: { items: { include: { voucher: true } } },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    return new Response(
      JSON.stringify({ total, limit, offset, orders }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
