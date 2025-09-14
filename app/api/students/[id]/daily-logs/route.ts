import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { DailyLogSchema, sanitize } from '@/lib/validation'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ items: [] })
  const st = await prisma.student.findUnique({ where: { id: params.id } })
  if (!st) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const allowed = user.role === 'ADMIN' || st.parentId === user.sub || st.amTherapistId === user.sub || st.pmTherapistId === user.sub
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const items = await prisma.dailyLog.findMany({ where: { studentId: params.id }, orderBy: { date: 'desc' }, take: 60 })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const st = await prisma.student.findUnique({ where: { id: params.id } })
  if (!st) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const allowed = user.role === 'ADMIN' || st.amTherapistId === user.sub || st.pmTherapistId === user.sub
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const json = await req.json()
  const parsed = DailyLogSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const created = await prisma.dailyLog.create({ data: { studentId: params.id, authorId: user.sub, date: parsed.data.date ? new Date(parsed.data.date) : new Date(), activities: parsed.data.activities ? sanitize(parsed.data.activities) : null, meals: parsed.data.meals ? sanitize(parsed.data.meals) : null, naps: parsed.data.naps ? sanitize(parsed.data.naps) : null, notes: parsed.data.notes ? sanitize(parsed.data.notes) : null } })
  return NextResponse.json(created, { status: 201 })
}
