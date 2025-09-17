import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d = new Date()) { const x = new Date(d); x.setHours(23,59,59,999); return x }

export async function GET() {
  const me = await getSession()
  if (!me || (me.role !== 'THERAPIST' && me.role !== 'ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const open = await prisma.clockEntry.findFirst({ where: { therapistId: me.sub, endedAt: null }, orderBy: { startedAt: 'desc' } })
  const todayEntries = await prisma.clockEntry.findMany({ where: { therapistId: me.sub, startedAt: { gte: startOfDay(), lte: endOfDay() } } })
  const totalMs = todayEntries.reduce((sum, e) => sum + (new Date(e.endedAt || new Date()).getTime() - new Date(e.startedAt).getTime()), 0)
  return NextResponse.json({
    clockedIn: Boolean(open),
    startedAt: open?.startedAt || null,
    todayMs: totalMs,
  })
}

export async function POST(req: NextRequest) {
  const me = await getSession()
  if (!me || (me.role !== 'THERAPIST' && me.role !== 'ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { action } = await req.json().catch(()=>({ action: '' })) as { action: string }
  if (action === 'start') {
    const open = await prisma.clockEntry.findFirst({ where: { therapistId: me.sub, endedAt: null } })
    if (open) return NextResponse.json({ error: 'Already clocked in' }, { status: 400 })
    const e = await prisma.clockEntry.create({ data: { therapistId: me.sub } })
    return NextResponse.json({ ok: true, entry: e })
  } else if (action === 'stop') {
    const open = await prisma.clockEntry.findFirst({ where: { therapistId: me.sub, endedAt: null }, orderBy: { startedAt: 'desc' } })
    if (!open) return NextResponse.json({ error: 'Not clocked in' }, { status: 400 })
    const e = await prisma.clockEntry.update({ where: { id: open.id }, data: { endedAt: new Date() } })
    return NextResponse.json({ ok: true, entry: e })
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
