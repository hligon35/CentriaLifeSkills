import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  if (!studentId) {
    // List students with their parent and therapists for avatars
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        parent: { select: { id: true, name: true, email: true, photoUrl: true } },
        amTherapist: { select: { id: true, name: true, email: true, photoUrl: true } },
        pmTherapist: { select: { id: true, name: true, email: true, photoUrl: true } },
      }
    })
    return NextResponse.json({ students })
  }
  // Fetch parent + therapists
  const stu = await prisma.student.findUnique({ where: { id: studentId } })
  if (!stu) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const participants = await prisma.user.findMany({ where: { id: { in: [stu.parentId, stu.amTherapistId, stu.pmTherapistId] } }, select: { id: true, name: true, email: true, photoUrl: true, role: true } })
  // Gather messages between parent and each therapist for this student
  const pairs = [
    { a: stu.parentId, b: stu.amTherapistId },
    { a: stu.parentId, b: stu.pmTherapistId }
  ]
  const msgs = await prisma.message.findMany({
    where: {
      OR: pairs.flatMap(({ a, b }) => ([
        { AND: [{ senderId: a }, { receiverId: b }] },
        { AND: [{ senderId: b }, { receiverId: a }] }
      ]))
    },
    orderBy: { createdAt: 'asc' }
  })
  return NextResponse.json({
    student: {
      id: stu.id,
      name: stu.name,
      parentId: stu.parentId,
      amTherapistId: stu.amTherapistId,
      pmTherapistId: stu.pmTherapistId,
    },
    participants,
    messages: msgs,
  })
}
