import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: { memoIds?: string[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const ids = Array.isArray(body.memoIds) ? Array.from(new Set(body.memoIds.filter(Boolean))) : []
  if (ids.length === 0) return NextResponse.json({ error: 'No memoIds' }, { status: 400 })

  try {
    for (const id of ids) {
      try {
        await prisma.urgentMemoReceipt.create({ data: { memoId: id, userId: user.sub } })
      } catch (_) {
        // Ignore unique constraint violations (already read)
      }
    }
    return NextResponse.json({ ok: true, marked: ids.length })
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // In dev, don't error if DB is unavailable; allow UI to continue.
      return NextResponse.json({ ok: true, marked: 0 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
