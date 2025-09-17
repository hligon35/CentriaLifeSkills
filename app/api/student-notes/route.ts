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
    // Parents can only see notes marked PARENT for their own children
    where.visibility = 'PARENT'
    where.student = { parentId: me.sub }
  }
  const notes = await prisma.studentNote.findMany({
    where,
    include: { student: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ notes })
}

export async function POST(req: NextRequest) {
  const me = await getSession()
  if (!me || (me.role !== 'THERAPIST' && me.role !== 'ADMIN')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { studentId, body, visibility } = await req.json().catch(()=>({})) as { studentId: string; body: string; visibility?: 'STAFF' | 'PARENT' }
  if (!studentId || !body?.trim()) return NextResponse.json({ error: 'studentId and body required' }, { status: 400 })
  const note = await prisma.studentNote.create({ data: { studentId, authorId: me.sub, body: body.trim(), visibility: visibility || 'STAFF' } })
  return NextResponse.json({ note }, { status: 201 })
}
