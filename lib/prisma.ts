import { PrismaClient } from '@prisma/client'

// Provide a sane default for local/dev if DATABASE_URL is not set
if (!process.env.DATABASE_URL && String(process.env.NODE_ENV) !== 'production') {
	process.env.DATABASE_URL = 'file:./dev.db'
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const url = process.env.DATABASE_URL || 'file:./dev.db'
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url } } })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
