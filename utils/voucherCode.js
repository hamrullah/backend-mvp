import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";

/** Generate string angka acak sepanjang n (boleh leading zero). */
export function genDigits(n = 15) {
  const bytes = randomBytes(n);
  let out = "";
  for (let i = 0; i < n; i++) out += (bytes[i] % 10).toString(); // 0..9
  return out;
}

/** Pastikan unik terhadap kolom unik ms_vouchers.code_voucher. */
export async function generateUniqueVoucherCode(len = 15, maxTry = 10) {
  for (let i = 0; i < maxTry; i++) {
    const code = genDigits(len);
    const exists = await prisma.ms_vouchers.findUnique({
      where: { code_voucher: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("Failed to generate unique voucher code");
}
