import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { ProgressReportSchema, sanitize } from '@/lib/validation'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ items: [] })
  const st = await prisma.student.findUnique({ where: { id: params.id } })
  if (!st) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const allowed = user.role === 'ADMIN' || st.parentId === user.sub || st.amTherapistId === user.sub || st.pmTherapistId === user.sub
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const items = await prisma.progressReport.findMany({ where: { studentId: params.id }, orderBy: { createdAt: 'desc' }, take: 50 })
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
  const parsed = ProgressReportSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const created = await prisma.progressReport.create({ data: { studentId: params.id, authorId: user.sub, title: sanitize(parsed.data.title), body: sanitize(parsed.data.body), goalsJson: parsed.data.goalsJson ?? null, periodStart: parsed.data.periodStart ? new Date(parsed.data.periodStart) : null, periodEnd: parsed.data.periodEnd ? new Date(parsed.data.periodEnd) : null } })
  return NextResponse.json(created, { status: 201 })
}
