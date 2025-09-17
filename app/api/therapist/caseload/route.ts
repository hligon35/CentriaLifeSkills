import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const me = await getSession()
  if (!me || (me.role !== 'THERAPIST' && me.role !== 'ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const list = await prisma.student.findMany({
    where: { OR: [ { amTherapistId: me.sub }, { pmTherapistId: me.sub }, { bcbaId: me.sub } ] },
    orderBy: { name: 'asc' },
    include: { parent: true },
  })
  return NextResponse.json({ students: list })
}
