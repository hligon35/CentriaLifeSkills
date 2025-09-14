import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { AppointmentCreateSchema } from '@/lib/validation'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') || user.role
  // Appointments are ONLY for parent ↔ BCBA monthly meetings
  if (role === 'THERAPIST') {
    const items = await prisma.appointment.findMany({ where: { therapistId: user.sub }, orderBy: { startAt: 'asc' }, include: { student: { select: { id: true, name: true } }, therapist: { select: { id: true, name: true, email: true } }, parent: { select: { id: true, name: true, email: true } } } })
    return NextResponse.json({ items })
  } else if (role === 'PARENT') {
    const items = await prisma.appointment.findMany({ where: { parentId: user.sub }, orderBy: { startAt: 'asc' }, include: { student: { select: { id: true, name: true } }, therapist: { select: { id: true, name: true, email: true } }, parent: { select: { id: true, name: true, email: true } } } })
    return NextResponse.json({ items })
  } else if (user.role === 'ADMIN') {
    const items = await prisma.appointment.findMany({ orderBy: { startAt: 'asc' }, include: { student: { select: { id: true, name: true } }, therapist: { select: { id: true, name: true, email: true } }, parent: { select: { id: true, name: true, email: true } } } })
    return NextResponse.json({ items })
  }
  return NextResponse.json({ items: [] })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = AppointmentCreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  // Parents can request BCBA meeting; BCBA/Admin can create
  const { therapistId, parentId, studentId, startAt, endAt } = parsed.data
  const isTherapist = user.role === 'THERAPIST' && user.sub === therapistId
  const isAdmin = user.role === 'ADMIN'
  const isParent = user.role === 'PARENT' && user.sub === parentId
  if (!isTherapist && !isAdmin && !isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // Validate student linkage
  // Type fallback: prisma types may be stale in this session; fetch and cast to any to access bcbaId
  const st = await prisma.student.findUnique({ where: { id: studentId } }) as any
  if (!st) return NextResponse.json({ error: 'Invalid student' }, { status: 400 })
  // Resolve therapistId from student's assigned BCBA if not provided by client
  const resolvedTherapistId = therapistId || st.bcbaId
  // Only allow appointments with the assigned BCBA
  if (!(st.parentId === parentId && resolvedTherapistId && st.bcbaId && st.bcbaId === resolvedTherapistId)) {
    return NextResponse.json({ error: 'Only parent ↔ assigned BCBA appointments are allowed' }, { status: 400 })
  }
  const created = await prisma.appointment.create({ data: { therapistId: resolvedTherapistId, parentId, studentId, startAt: new Date(startAt), endAt: new Date(endAt), status: isParent ? 'PENDING' : 'CONFIRMED' } })
  return NextResponse.json(created, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const { id, status } = json || {}
  if (!id || !status) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const appt = await prisma.appointment.findUnique({ where: { id } })
  if (!appt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isTherapist = user.role === 'THERAPIST' && appt.therapistId === user.sub
  const isParent = user.role === 'PARENT' && appt.parentId === user.sub
  const isAdmin = user.role === 'ADMIN'
  if (!isTherapist && !isParent && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const updated = await prisma.appointment.update({ where: { id }, data: { status: String(status).toUpperCase() } })
  return NextResponse.json(updated)
}
