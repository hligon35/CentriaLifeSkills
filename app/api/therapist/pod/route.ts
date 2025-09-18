import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'THERAPIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const students = await prisma.student.findMany({
      where: { OR: [ { amTherapistId: user.sub }, { pmTherapistId: user.sub } ] },
      select: { id: true, name: true, amTherapistId: true, pmTherapistId: true }
    })
    const am = students.filter(s => s.amTherapistId === user.sub).map(s => ({ id: s.id, name: s.name }))
    const pm = students.filter(s => s.pmTherapistId === user.sub).map(s => ({ id: s.id, name: s.name }))
    return NextResponse.json({ am, pm })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load pod' }, { status: 500 })
  }
}
