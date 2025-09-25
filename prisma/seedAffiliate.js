import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash("123456", 10)

  // === Buat user affiliate ===
  const affiliateUser = await prisma.user.upsert({
    where: { email: "affiliate@example.com" },
    update: {},
    create: {
      name: "Affiliate User",
      email: "affiliate@example.com",
      password: hashed,
      role: "Affiliate",
    },
  })

  // === Buat affiliate terkait user tersebut ===
  await prisma.affiliate.upsert({
    where: { userId: affiliateUser.id },
    update: {},
    create: {
      userId: affiliateUser.id,
      code: "AFF001", // harus unique
      commissionRate: 10.0, // contoh 10%
      bankAccount: {
        bankName: "BCA",
        accountNumber: "1234567890",
        accountHolder: "Affiliate User",
      },
    },
  })

  console.log("✅ Affiliate user + affiliate record created")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
