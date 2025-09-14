import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0)
  const endOfDay = new Date(now); endOfDay.setHours(23,59,59,999)
  const graceMin = 5

  const [shifts, openClocks] = await Promise.all([
    (prisma as any).workShift.findMany({ where: { startAt: { gte: startOfDay }, endAt: { lte: endOfDay } }, include: { therapist: { select: { id: true, name: true, email: true } }, student: { select: { id: true, name: true } } } }),
    (prisma as any).clockEntry.findMany({ where: { endedAt: null }, include: { therapist: { select: { id: true, name: true, email: true } } } })
  ])

  const scheduled = new Map<string, any[]>() // therapistId -> shifts today
  for (const s of shifts) {
    const arr = scheduled.get(s.therapistId) || []
    arr.push(s)
    scheduled.set(s.therapistId, arr)
  }

  const clockedInIds = new Set<string>(openClocks.map((c: any) => c.therapistId))
  const allTherapists = new Set<string>([...scheduled.keys(), ...clockedInIds])

  const result: { scheduled: any[]; clockedIn: any[]; late: any[]; available: any[] } = { scheduled: [], clockedIn: [], late: [], available: [] }

  for (const tid of allTherapists) {
    const todays = scheduled.get(tid) || []
    const isClocked = clockedInIds.has(tid)
    const currentShift = todays.find((s: any) => new Date(s.startAt) <= now && now <= new Date(s.endAt))
    if (isClocked) {
      result.clockedIn.push({ therapistId: tid, therapist: openClocks.find((c: any) => c.therapistId === tid)?.therapist, currentShift })
    } else if (currentShift) {
      const lateThreshold = new Date(currentShift.startAt)
      lateThreshold.setMinutes(lateThreshold.getMinutes() + graceMin)
      if (now > lateThreshold) {
        result.late.push({ therapistId: tid, therapist: currentShift.therapist, shift: currentShift })
      } else {
        result.scheduled.push({ therapistId: tid, therapist: currentShift.therapist, shift: currentShift })
      }
    } else {
      result.available.push({ therapistId: tid })
    }
  }

  return NextResponse.json(result)
}
