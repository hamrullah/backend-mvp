import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const affiliateId = searchParams.get("affiliate_id");
    const memberId = searchParams.get("member_id");
    const statusParam = searchParams.get("status"); // "ALL" | "1" | "0" | "2"
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // ---- WHERE untuk aggregate & groupBy (Prisma) ----
    const where = {};
    if (affiliateId) where.affilate_id = Number(affiliateId);
    if (memberId) where.member_id = Number(memberId);
    if (statusParam && statusParam !== "ALL") where.status = Number(statusParam);
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = new Date(dateFrom);
      if (dateTo) where.created_at.lt = new Date(dateTo);
    }

    const [agg, count, byStatus] = await Promise.all([
      prisma.affiliate_commision.aggregate({ where, _sum: { commision: true } }),
      prisma.affiliate_commision.count({ where }),
      prisma.affiliate_commision.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
    ]);

    const totalCommission = Number(agg._sum.commision || 0);

    // ---- WHERE dinamis untuk RAW monthly bucket ----
    const conds = [];
    if (affiliateId) conds.push(Prisma.sql`"affilate_id" = ${Number(affiliateId)}`);
    if (memberId) conds.push(Prisma.sql`"member_id" = ${Number(memberId)}`);
    if (statusParam && statusParam !== "ALL")
      conds.push(Prisma.sql`"status" = ${Number(statusParam)}`);
    if (dateFrom) conds.push(Prisma.sql`"created_at" >= ${new Date(dateFrom)}`);
    if (dateTo) conds.push(Prisma.sql`"created_at" < ${new Date(dateTo)}`);

    // ❗ Perbaikan di sini: gunakan string ' AND ' (BUKAN Prisma.sql` AND `)
    const whereSql =
      conds.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conds, ' AND ')}` : Prisma.sql``;

    const monthly = await prisma.$queryRaw(
      Prisma.sql`
        SELECT to_char(date_trunc('month',"created_at"), 'YYYY-MM') AS ym,
               SUM("commision")::text AS total
        FROM "affiliate_commision"
        ${whereSql}
        GROUP BY ym
        ORDER BY ym
      `
    );

    return NextResponse.json(
      {
        message: "Affiliate commission summary",
        totalCommission,
        count,
        byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
        monthly: monthly.map((r) => ({ month: r.ym, total: Number(r.total) })),
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
