// app/api/auth/refresh/route.js
import { PrismaClient } from "@prisma/client"
import { verifyTokenHash, hashToken, generateRefreshTokenValue } from "@/lib/tokens"

const prisma = new PrismaClient()

export async function POST(req) {
  const { refreshToken } = await req.json()
  if (!refreshToken) return new Response(JSON.stringify({ error: "No token" }), { status: 400 })

  // find candidate refresh token row by user: best approach is to look up all non-revoked tokens and compare hashes
  const tokens = await prisma.refreshToken.findMany({
    where: { revoked: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  })

  // Try to match hash
  for (const row of tokens) {
    const match = await verifyTokenHash(refreshToken, row.tokenHash)
    if (match) {
      // rotate: revoke current token, create new one
      await prisma.refreshToken.update({ where: { id: row.id }, data: { revoked: true } })

      const newVal = generateRefreshTokenValue()
      const newHash = await hashToken(newVal)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      await prisma.refreshToken.create({
        data: {
          tokenHash: newHash,
          userId: row.userId,
          expiresAt,
          revoked: false
        }
      })

      // issue new short-lived access token (optional) — if you rely on NextAuth session, you can call session update.
      // For simplicity, return newRefreshToken (and maybe new JWT if you issue one).
      return new Response(JSON.stringify({ refreshToken: newVal }), { status: 200 })
    }
  }

  return new Response(JSON.stringify({ error: "Invalid refresh token" }), { status: 403 })
}
