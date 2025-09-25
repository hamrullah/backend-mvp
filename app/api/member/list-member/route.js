// app/api/member/list-member/route.js
import prisma from "@/lib/prisma"

// ---------- CORS ----------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // set origin FE di production
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

// ---------- Helpers ----------
const toPosInt = (v, def) => {
  if (v === null || v === undefined || v === "") return def
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : def
}
const toNonNegInt = (v, def) => {
  if (v === null || v === undefined || v === "") return def
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : def
}
const toSortDir = (v) => (String(v).toLowerCase() === "asc" ? "asc" : "desc")
const allowSortBy = new Set(["created_at", "updated_at", "name", "email", "city", "status"])
const sortKeyMap = {
  created_at: "created_at",
  updated_at: "updated_at",
  name: "name_member",
  email: "email",
  city: "city",
  status: "status",
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)

    // Pagination: support limit/offset atau page/pageSize
    const pageParam = toPosInt(searchParams.get("page"), null)
    const pageSizeParam = toPosInt(searchParams.get("pageSize"), null)

    // Pakai page/pageSize hanya kalau KEDUA-NYA valid (>0)
    let limit = toPosInt(searchParams.get("limit"), 10)
    let offset = toNonNegInt(searchParams.get("offset"), 0)
    if (pageParam != null && pageSizeParam != null) {
      limit = pageSizeParam
      offset = Math.max(0, (pageParam - 1) * pageSizeParam)
    }
    if (!limit || limit <= 0) limit = 10 // guard terakhir

    // Filters
    const q = (searchParams.get("q") || "").trim()
    const statusStr = searchParams.get("status") // "1" | "0" | "ALL" | null
    const status =
      statusStr && statusStr !== "ALL" && !Number.isNaN(Number(statusStr))
        ? Number(statusStr)
        : null
    const affiliateIdStr = searchParams.get("affiliateId")
    const affiliateId =
      affiliateIdStr && !Number.isNaN(Number(affiliateIdStr)) ? Number(affiliateIdStr) : null
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // Sorting
    const sortByRaw = searchParams.get("sortBy") || "created_at"
    const sortBy = allowSortBy.has(sortByRaw) ? sortByRaw : "created_at"
    const sortDir = toSortDir(searchParams.get("sortDir") || "desc")

    // Build where
    const where = {}
    if (status !== null) where.status = status
    if (affiliateId !== null) where.affiliate_id = affiliateId
    if (q) {
      where.OR = [
        { name_member: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { code_member: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { province: { contains: q, mode: "insensitive" } },
      ]
    }
    if (from || to) {
      where.created_at = {}
      if (from) where.created_at.gte = new Date(from)
      if (to) where.created_at.lte = new Date(to)
    }

    // Order By
    const orderBy = {}
    orderBy[sortKeyMap[sortBy]] = sortDir

    // Query
    const total = await prisma.ms_member.count({ where })
    const members = await prisma.ms_member.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        affiliate: { select: { id: true, code_affiliate: true, name_affiliate: true } },
        _count: { select: { orders: true } }, // opsional kalau relasi orders ada
      },
    })

    const page = Math.floor(offset / limit) + 1
    const totalPages = Math.max(1, Math.ceil(total / limit))

    return new Response(
      JSON.stringify({
        members,
        pagination: { limit, offset, total },
        page,
        pageSize: limit,
        total,
        totalPages,
        data: members,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    )
  } catch (err) {
    console.error("list-member error:", err)
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    })
  }
}
