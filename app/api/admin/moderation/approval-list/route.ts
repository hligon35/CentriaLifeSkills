import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const PREFIX = 'board.moderation.required.user:'

export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await prisma.appSetting.findMany({ where: { key: { startsWith: PREFIX } } })
  const ids = rows.filter(r => (r.value || '').toLowerCase() === 'true').map(r => r.key.slice(PREFIX.length))
  return NextResponse.json({ userIds: ids })
}

export async function POST(req: NextRequest) {
  const me = await getSession()
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { userIds, require } = await req.json().catch(() => ({ userIds: [], require: true })) as { userIds: string[]; require: boolean }
  const ids = Array.isArray(userIds) ? userIds.filter(x=>typeof x === 'string' && x) : []
  if (ids.length === 0) return NextResponse.json({ error: 'No userIds' }, { status: 400 })
  if (require) {
    await prisma.$transaction(ids.map(id => prisma.appSetting.upsert({ where: { key: PREFIX + id }, update: { value: 'true' }, create: { key: PREFIX + id, value: 'true' } })))
  } else {
    await prisma.$transaction(ids.map(id => prisma.appSetting.deleteMany({ where: { key: PREFIX + id } })))
  }
  await prisma.auditLog.create({ data: { userId: me.sub, action: require ? 'MODERATION_REQUIRE' : 'MODERATION_ALLOW', entity: 'User', details: JSON.stringify({ count: ids.length }) } })
  return NextResponse.json({ ok: true, count: ids.length })
}
