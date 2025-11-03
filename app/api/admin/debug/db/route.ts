import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function checkToken(req: NextRequest) {
  const cfg = process.env.ADMIN_MAINT_TOKEN
  if (!cfg) return false
  const h = req.headers.get('x-maint-token') || ''
  const url = new URL(req.url)
  const q = url.searchParams.get('token') || ''
  return h === cfg || q === cfg
}

export async function GET(req: NextRequest) {
  if (!checkToken(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const info: any = { ok: true }
  try {
    const url = process.env.DATABASE_URL || 'file:./dev.db'
    info.nodeEnv = process.env.NODE_ENV
    info.databaseUrlScheme = url.split(':')[0]
    // Try a generic ping
    try {
      await prisma.$queryRaw`SELECT 1`
      info.ping = 'ok'
    } catch (e) {
      info.ping = 'fail'
      info.pingError = (e as Error).message
    }
    // Probe for User table existence (sqlite first)
    try {
      const rows: Array<{ name: string }> = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name='User'")
      info.userTableSqlite = rows.length > 0
    } catch {
      info.userTableSqlite = false
    }
    // Probe for User table existence (postgres)
    try {
      const rows2: Array<{ exists: boolean }> = await prisma.$queryRawUnsafe("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='User') AS exists")
      info.userTablePostgres = rows2?.[0]?.exists === true
    } catch {
      info.userTablePostgres = false
    }
    return NextResponse.json(info)
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
