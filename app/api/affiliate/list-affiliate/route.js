// app/api/affiliate/list-affiliate/route.js
import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

// ---------- CORS ----------
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // ganti ke origin FE di prod
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

// ---------- Utils ----------
const toInt = (v, d) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}
const toBool = (v) => v === "1" || v === "true"

// ---------- GET /api/affiliate/list-affiliate ----------
export async function GET(req) {
  try {
    // (opsional) Auth via JWT
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders(),
      })
    }
    try {
      jwt.verify(authHeader.split(" ")[1], process.env.NEXTAUTH_SECRET)
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: corsHeaders(),
      })
    }

    const url = new URL(req.url)
    const sp = url.searchParams

    // Pagination: support limit/offset atau page/pageSize
    const pageParam = sp.get("page")
    const pageSizeParam = sp.get("pageSize")
    let limit = toInt(sp.get("limit"), toInt(pageSizeParam, 10))
    limit = Math.min(Math.max(1, limit || 10), 100)

    let offset = toInt(sp.get("offset"), 0)
    if (pageParam) {
      const page = Math.max(1, toInt(pageParam, 1))
      offset = (page - 1) * limit
    }
    offset = Math.max(0, offset)

    // Filters
    const q = (sp.get("q") || "").trim()
    const status = sp.get("status")
    const city = (sp.get("city") || "").trim()
    const province = (sp.get("province") || "").trim()
    const hasUser = toBool(sp.get("hasUser")) // hanya yg punya user_id

    const from = sp.get("from") // YYYY-MM-DD
    const to = sp.get("to")     // YYYY-MM-DD

    // Sorting
    const sortBy = (sp.get("sortBy") || "created_at").toLowerCase()
    const sortDir = (sp.get("sortDir") || "desc").toLowerCase() === "asc" ? "asc" : "desc"
    const sortMap = {
      name: "name_affiliate",
      created_at: "created_at",
      updated_at: "updated_at",
      email: "email",
      city: "city",
      status: "status",
    }
    const orderBy = { [sortMap[sortBy] || "created_at"]: sortDir }

    // Where
    const where = { AND: [] }

    if (q) {
      where.AND.push({
        OR: [
          { code_affiliate: { contains: q, mode: "insensitive" } },
          { name_affiliate: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { referral_code: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { province: { contains: q, mode: "insensitive" } },
          { twitter: { contains: q, mode: "insensitive" } },
          { instagram: { contains: q, mode: "insensitive" } },
          { tiktok: { contains: q, mode: "insensitive" } },
        ],
      })
    }
    if (status !== null && status !== "") {
      const s = Number(status)
      if (Number.isInteger(s)) where.AND.push({ status: s })
    }
    if (city) where.AND.push({ city: { contains: city, mode: "insensitive" } })
    if (province) where.AND.push({ province: { contains: province, mode: "insensitive" } })
    if (hasUser) where.AND.push({ NOT: { user_id: null } })

    if (from || to) {
      const range = {}
      if (from) {
        const d = new Date(from)
        if (!Number.isNaN(d.getTime())) range.gte = d
      }
      if (to) {
        const d = new Date(to)
        if (!Number.isNaN(d.getTime())) range.lte = new Date(d.getTime() + 86400000 - 1)
      }
      if (Object.keys(range).length) where.AND.push({ created_at: range })
    }

    // Query
    const [total, rows] = await Promise.all([
      prisma.ms_affiliate.count({ where }),
      prisma.ms_affiliate.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true,
          code_affiliate: true,
          name_affiliate: true,
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
          referral_code: true,
          _count: { select: { members: true } }, // jumlah member dibawah affiliate
        },
      }),
    ])

    const data = rows.map((r) => ({
      id: r.id,
      code_affiliate: r.code_affiliate,
      name_affiliate: r.name_affiliate,
      email: r.email,
      address: r.address,
      city: r.city,
      province: r.province,
      postal_code: r.postal_code,
      image: r.image,
      twitter: r.twitter,
      instagram: r.instagram,
      tiktok: r.tiktok,
      user_id: r.user_id,
      status: r.status,
      flag: r.flag,
      created_at: r.created_at,
      updated_at: r.updated_at,
      referral_code: r.referral_code,
      members_count: r._count?.members ?? 0,
    }))

    const page = Math.floor(offset / limit) + 1
    const resp = {
      affiliates: data,
      pagination: { limit, offset, total },
      // juga sediakan bentuk page/pageSize biar seragam dengan endpoint lain
      page,
      pageSize: limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      data, // alias
    }

    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders(),
    })
  }
}
