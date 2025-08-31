import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q) return NextResponse.json({ posts: [], staff: [], students: [], events: [] })

  const posts = await prisma.post.findMany({
  where: { OR: [{ title: { contains: q } }, { body: { contains: q } }] },
    select: { id: true, title: true, createdAt: true },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  // Staff limited by role visibility
  const staff = await prisma.user.findMany({
    where: {
      role: { in: user.role === 'ADMIN' ? ['ADMIN', 'THERAPIST', 'PARENT'] : ['THERAPIST'] },
  OR: [{ name: { contains: q } }, { email: { contains: q } }]
    },
    select: { id: true, name: true, role: true },
    take: 10
  })

  // Students visible by RBAC
  let studentWhere: any = { name: { contains: q } }
  if (user.role === 'THERAPIST') studentWhere = { ...studentWhere, OR: [{ amTherapistId: user.sub }, { pmTherapistId: user.sub }] }
  if (user.role === 'PARENT') studentWhere = { ...studentWhere, parentId: user.sub }
  const students = await prisma.student.findMany({ where: studentWhere, select: { id: true, name: true }, take: 10 })

  // Cast to any to avoid type errors if Prisma client hasn't been regenerated yet
  const events = await (prisma as any).event.findMany({
    where: {
      AND: [
    { OR: [ { title: { contains: q } }, { description: { contains: q } }, { location: { contains: q } } ] },
        { OR: [ { audience: 'ALL' }, { audience: user.role }, { audience: 'USER', targetUserId: user.sub } ] }
      ]
    },
    select: { id: true, title: true, startAt: true, endAt: true },
    take: 10,
    orderBy: { startAt: 'desc' }
  })

  return NextResponse.json({ posts, staff, students, events })
}
