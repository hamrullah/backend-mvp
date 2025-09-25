// lib/tokens.js
import crypto from "crypto"
import bcrypt from "bcryptjs"

export function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString("hex")
}

export async function hashToken(token) {
  return await bcrypt.hash(token, 10)
}

export async function verifyTokenHash(token, hash) {
  return await bcrypt.compare(token, hash)
}
