import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function setPassword(email: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) { console.log(`[skip] ${email} not found`); return }
  const passwordHash = await argon2.hash(newPassword)
  await prisma.user.update({ where: { email }, data: { passwordHash } })
  console.log(`[updated] ${email} password reset`)
}

async function main() {
  await setPassword('parent88@example.com', 'Dad12345')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => prisma.$disconnect())
