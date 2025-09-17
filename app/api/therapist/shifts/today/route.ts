import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d = new Date()) { const x = new Date(d); x.setHours(23,59,59,999); return x }

export async function GET() {
  const me = await getSession()
  if (!me || (me.role !== 'THERAPIST' && me.role !== 'ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [shifts, appts, events] = await Promise.all([
    prisma.workShift.findMany({ where: { therapistId: me.sub, startAt: { gte: startOfDay(), lte: endOfDay() } }, orderBy: { startAt: 'asc' }, include: { student: true } }),
    prisma.appointment.findMany({ where: { therapistId: me.sub, startAt: { gte: startOfDay(), lte: endOfDay() } }, orderBy: { startAt: 'asc' }, include: { student: true, parent: true } }),
    prisma.event.findMany({ where: { OR: [ { audience: 'ALL' }, { audience: 'THERAPIST' }, { audience: 'USER', targetUserId: me.sub } ], startAt: { gte: startOfDay(), lte: endOfDay() } }, orderBy: { startAt: 'asc' } })
  ])
  return NextResponse.json({ shifts, appointments: appts, events })
}
