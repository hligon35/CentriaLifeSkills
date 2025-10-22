import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function ensureUser(email: string, password: string, name: string, role: 'ADMIN' | 'PARENT' | 'THERAPIST') {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`[skip] ${email} already exists (role=${existing.role})`)
    return existing
  }
  const passwordHash = await argon2.hash(password)
  const created = await prisma.user.create({ data: { email, name, role, passwordHash } })
  console.log(`[create] ${email} (${role}) -> ${created.id}`)
  return created
}

async function main() {
  await ensureUser('admin@example.com', 'admin123', 'Admin', 'ADMIN')
  // Use 8+ char password to satisfy LoginSchema
  await ensureUser('parent88@example.com', 'Dad12345', 'Parent 88', 'PARENT')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
