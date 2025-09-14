import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/directory/students?search=... (name contains)
// RBAC:
// - ADMIN: all students
// - THERAPIST: only students where user is AM or PM therapist
// - PARENT: only their child(ren)
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('search') || '').trim()

  const nameFilter = q ? { name: { contains: q, mode: 'insensitive' } } : {}

  if (user.role === 'ADMIN') {
    const students = await prisma.student.findMany({
      where: { ...nameFilter },
      select: {
        id: true,
        name: true,
        parent: { select: { id: true, name: true, email: true, photoUrl: true } },
        amTherapist: { select: { id: true, name: true, email: true, photoUrl: true } },
  pmTherapist: { select: { id: true, name: true, email: true, photoUrl: true } },
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ students })
  }

  if (user.role === 'THERAPIST') {
    const students = await prisma.student.findMany({
      where: {
        ...nameFilter,
        OR: [
          { amTherapistId: user.sub },
          { pmTherapistId: user.sub },
        ],
      },
      select: {
        id: true,
        name: true,
        parent: { select: { id: true, name: true, photoUrl: true } },
        amTherapist: { select: { id: true, name: true, photoUrl: true } },
  pmTherapist: { select: { id: true, name: true, photoUrl: true } },
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ students })
  }

  if (user.role === 'PARENT') {
    const students = await prisma.student.findMany({
      where: { ...nameFilter, parentId: user.sub },
      select: {
        id: true,
        name: true,
        amTherapist: { select: { id: true, name: true, photoUrl: true } },
  pmTherapist: { select: { id: true, name: true, photoUrl: true } },
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ students })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
