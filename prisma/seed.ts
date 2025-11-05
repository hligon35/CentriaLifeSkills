import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const pass = await argon2.hash('Password123!')
  const therapist = await prisma.user.upsert({
    where: { email: 'therapist@example.com' },
    update: {},
  create: { email: 'therapist@example.com', name: 'Therapist Alice', role: 'THERAPIST', passwordHash: pass }
  })
  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
  create: { email: 'parent@example.com', name: 'Parent Bob', role: 'PARENT', passwordHash: pass }
  })
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Admin User', role: 'ADMIN', passwordHash: pass }
  })
  console.log({ therapist, parent, admin })
}

main().finally(() => prisma.$disconnect())
