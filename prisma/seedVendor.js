import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash("123456", 10)

  // buat / ambil user vendor
  const vendorUser = await prisma.user.upsert({
    where: { email: "vendor@example.com" },
    update: {},
    create: {
      name: "vendor user",
      email: "vendor@example.com",
      password: hashed,
      role: "Vendor",
    },
  })

  // buat / ambil vendor terkait user tsb
  await prisma.vendor.upsert({
    where: { ownerUserId: vendorUser.id },
    update: {},
    create: {
      ownerUserId: vendorUser.id,
      storeName: "Toko Contoh",
      kycStatus: "PENDING", // bisa di-skip karena default
      bankAccount: {
        bankName: "BCA",
        accountNumber: "1234567890",
        accountHolder: "vendor user",
      },
      settlementTerms: "NET30",
    },
  })

  console.log("✅ Vendor user + vendor record created")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
