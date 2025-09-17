import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

function startOfWeek(d = new Date()) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = (day + 6) % 7 // Monday=0
  x.setDate(x.getDate() - diff)
  x.setHours(0,0,0,0)
  return x
}
function endOfWeek(d = new Date()) {
  const s = startOfWeek(d)
  const e = new Date(s)
  e.setDate(s.getDate() + 6)
  e.setHours(23,59,59,999)
  return e
}

export async function GET(req: NextRequest) {
  const me = await getSession()
  if (!me || (me.role !== 'THERAPIST' && me.role !== 'ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const week = url.searchParams.get('week') // YYYY-MM-DD within week
  const base = week ? new Date(week) : new Date()
  const from = startOfWeek(base)
  const to = endOfWeek(base)
  const entries = await prisma.clockEntry.findMany({ where: { therapistId: me.sub, startedAt: { gte: from, lte: to } }, orderBy: { startedAt: 'asc' } })
  const dayBuckets: Record<string, number> = {}
  for (const e of entries) {
    const end = new Date(e.endedAt || new Date())
    const dur = end.getTime() - new Date(e.startedAt).getTime()
    const key = new Date(e.startedAt).toISOString().slice(0,10)
    dayBuckets[key] = (dayBuckets[key] || 0) + Math.max(0, dur)
  }
  const totalMs = Object.values(dayBuckets).reduce((a,b)=>a+b,0)
  return NextResponse.json({ from, to, days: dayBuckets, totalMs })
}
