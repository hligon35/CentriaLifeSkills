import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const me = await getSession()
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: { title?: string; body?: string; active?: boolean; expiresAt?: string | null; userIds?: string[]; audienceRole?: 'PARENT' | 'THERAPIST' | 'ADMIN' }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const title = String(body.title || '').trim().slice(0, 200)
  const msg = String(body.body || '').trim().slice(0, 5000)
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
  let list = Array.isArray(body.userIds) ? Array.from(new Set(body.userIds.filter(Boolean))) : []
  if (list.length === 0 && body.audienceRole) {
    const users = await prisma.user.findMany({ where: { role: body.audienceRole } })
    list = users.map(u => u.id)
  }
  if (!title || !msg) return NextResponse.json({ error: 'Missing title or body' }, { status: 400 })
  if (list.length === 0) return NextResponse.json({ error: 'No userIds' }, { status: 400 })

  await prisma.urgentMemo.createMany({
    data: list.map(uid => ({ title, body: msg, active: body.active ?? true, audience: 'USER', targetUserId: uid, expiresAt })),
  })
  await prisma.auditLog.create({ data: { userId: me.sub, action: 'MEMO_BULK_CREATE', entity: 'UrgentMemo', details: JSON.stringify({ count: list.length, audienceRole: body.audienceRole || null }) } })
  return NextResponse.json({ ok: true, created: list.length })
}
