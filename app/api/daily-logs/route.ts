import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const me = await getSession()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const studentId = url.searchParams.get('studentId') || undefined
  const where: any = {}
  if (studentId) where.studentId = studentId
  if (me.role === 'PARENT') {
    // Parents can only see logs for their own children
    where.student = { parentId: me.sub }
  }
  const logs = await prisma.dailyLog.findMany({
    where,
    include: { student: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
    take: 50,
  })
  return NextResponse.json({ logs })
}

export async function POST(req: NextRequest) {
  const me = await getSession()
  if (!me || (me.role !== 'THERAPIST' && me.role !== 'ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { studentId, activities, meals, naps, notes, minutes, date } = await req.json().catch(()=>({})) as { studentId: string; activities?: string; meals?: string; naps?: string; notes?: string; minutes?: number; date?: string }
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })
  const data: any = { studentId, authorId: me.sub, activities: activities || null, meals: meals || null, naps: naps || null, notes: notes || null }
  if (minutes && minutes > 0) data.activities = (data.activities ? data.activities + '\n' : '') + `Duration: ${minutes} minutes`
  if (date) data.date = new Date(date)
  const log = await prisma.dailyLog.create({ data })
  return NextResponse.json({ log }, { status: 201 })
}
