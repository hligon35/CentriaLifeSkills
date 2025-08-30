import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // simple db ping
    await prisma.$queryRaw`SELECT 1`
    const ssoConfigured = !!(process.env.OIDC_AUTH_URL && process.env.OIDC_TOKEN_URL && process.env.OIDC_USERINFO_URL && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET && process.env.OIDC_REDIRECT_URI)
    return NextResponse.json({ ok: true, db: 'up', ssoConfigured })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}
