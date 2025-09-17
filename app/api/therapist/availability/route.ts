import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const me = await getSession()
  if (!me || (me.role !== 'THERAPIST' && me.role !== 'ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const slots = await prisma.therapistAvailability.findMany({ where: { therapistId: me.sub }, orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }] })
  return NextResponse.json({ slots })
}

export async function POST(req: NextRequest) {
  const me = await getSession()
  if (!me || (me.role !== 'THERAPIST' && me.role !== 'ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slots } = await req.json().catch(()=>({ slots: [] })) as { slots: Array<{ weekday: number; startTime: string; endTime: string }> }
  if (!Array.isArray(slots)) return NextResponse.json({ error: 'slots required' }, { status: 400 })
  await prisma.$transaction([
    prisma.therapistAvailability.deleteMany({ where: { therapistId: me.sub } }),
    ...slots.map(s => prisma.therapistAvailability.create({ data: { therapistId: me.sub, weekday: s.weekday, startTime: s.startTime, endTime: s.endTime } })),
  ])
  return NextResponse.json({ ok: true })
}
