import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { StudentNoteSchema, sanitize } from '@/lib/validation'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ items: [] })
  const studentId = params.id
  // RBAC: therapist assigned to student or parent of student or admin
  const st = await prisma.student.findUnique({ where: { id: studentId } })
  if (!st) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const allowed = user.role === 'ADMIN' || st.parentId === user.sub || st.amTherapistId === user.sub || st.pmTherapistId === user.sub
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const items = await prisma.studentNote.findMany({ where: { studentId, ...(user.role === 'PARENT' ? { visibility: 'PARENT' } : {}) }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const studentId = params.id
  const st = await prisma.student.findUnique({ where: { id: studentId } })
  if (!st) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const allowed = user.role === 'ADMIN' || st.amTherapistId === user.sub || st.pmTherapistId === user.sub
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const json = await req.json()
  const parsed = StudentNoteSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const created = await prisma.studentNote.create({ data: { studentId, authorId: user.sub, body: sanitize(parsed.data.body), visibility: parsed.data.visibility || 'STAFF' } })
  return NextResponse.json(created, { status: 201 })
}
