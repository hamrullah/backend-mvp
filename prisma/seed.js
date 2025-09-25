import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash("123456", 10)
  await prisma.user.upsert({
    where: { email: "admin1@example.com" },
    update: {},
    create: {
      name : 'test admin',
      email: "admin1@example.com",
      password: hashed,
      role: "admin",
    },
  })
  console.log("✅ Admin user created")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
