import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// Consolidated session bootstrap endpoint
// Returns authenticated user (if any) plus commonly-needed public app settings.
export async function GET() {
  const user = await getSession().catch(() => null)
  const headers = new Headers({ 'Cache-Control': 'private, max-age=30' })
  try {
    const keys = ['BOARD_TITLE','BOARD_SUBTITLE','BOARD_FOOTER']
    const rows = await prisma.appSetting.findMany({ where: { key: { in: keys } }, select: { key: true, value: true } })
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]))
    return NextResponse.json({ user, settings }, { headers })
  } catch {
    return NextResponse.json({ user, settings: {} }, { headers })
  }
}