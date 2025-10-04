import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ORIGIN = "http://localhost:3001";
const corsHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // ---- query params
    const limit   = toInt(searchParams.get("limit"), 10);
    const offset  = toInt(searchParams.get("offset"), 0);
    const q       = (searchParams.get("q") || "").trim();
    const sortBy  = (searchParams.get("sortBy") || "created_at").toLowerCase();
    const sortDir = (searchParams.get("sortDir") || "desc").toLowerCase(); // 'asc' | 'desc'

    const affId   = searchParams.get("affiliate_id");
    const memId   = searchParams.get("member_id");
    const statusQ = searchParams.get("status"); // "ALL" | "1" | "0" | "2"
    const dateFrom = searchParams.get("dateFrom"); // ISO
    const dateTo   = searchParams.get("dateTo");   // ISO (exclusive)

    // ---- WHERE (Prisma)
    const where = {};
    if (affId)  where.affilate_id = Number(affId);  // kolom di schema: affilate_id
    if (memId)  where.member_id   = Number(memId);
    if (statusQ && statusQ !== "ALL") where.status = Number(statusQ);
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = new Date(dateFrom);
      if (dateTo)   where.created_at.lt  = new Date(dateTo);
    }
    if (q) {
      where.OR = [
        { affiliate: { name_affiliate: { contains: q, mode: "insensitive" } } },
        { affiliate: { email:          { contains: q, mode: "insensitive" } } },
        { member:    { name_member:    { contains: q, mode: "insensitive" } } },
        { member:    { email:          { contains: q, mode: "insensitive" } } },
      ];
    }

    // ---- ORDER BY
    const dir = sortDir === "asc" ? "asc" : "desc";
    let orderBy = { created_at: dir };
    if (sortBy === "updated_at")     orderBy = { updated_at: dir };
    else if (sortBy === "commision") orderBy = { commision: dir };
    else if (sortBy === "status")    orderBy = { status: dir };
    else if (sortBy === "affiliate") orderBy = { affiliate: { name_affiliate: dir } };
    else if (sortBy === "member")    orderBy = { member: { name_member: dir } };
    // default created_at

    // ---- Query data
    const [total, sumAll, rows] = await Promise.all([
      prisma.affiliate_commision.count({ where }),
      prisma.affiliate_commision.aggregate({ where, _sum: { commision: true } }),
      prisma.affiliate_commision.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          affiliate: { select: { id: true, name_affiliate: true, email: true } },
          member:    { select: { id: true, name_member: true, email: true } },
        },
      }),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      affiliate_id: r.affilate_id,
      member_id: r.member_id,
      commission: Number(r.commision),
      status: r.status,
      flag: r.flag,
      created_at: r.created_at,
      updated_at: r.updated_at,
      affiliate: r.affiliate
        ? { id: r.affiliate.id, name: r.affiliate.name_affiliate, email: r.affiliate.email }
        : null,
      member: r.member
        ? { id: r.member.id, name: r.member.name_member, email: r.member.email }
        : null,
    }));

    return NextResponse.json(
      {
        message: "Affiliate commission list",
        pagination: { total, limit, offset },
        summary: { totalCommission: Number(sumAll._sum.commision || 0) },
        items,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return new NextResponse(
      JSON.stringify({ error: err?.message ?? "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
}
