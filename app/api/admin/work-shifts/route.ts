import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ? new Date(String(searchParams.get('from'))) : new Date(Date.now() - 24*3600*1000)
  const to = searchParams.get('to') ? new Date(String(searchParams.get('to'))) : new Date(Date.now() + 14*24*3600*1000)
  const rows = await (prisma as any).workShift.findMany({ where: { startAt: { gte: from }, endAt: { lte: to } }, include: { therapist: { select: { id: true, name: true, email: true } }, student: { select: { id: true, name: true } } }, orderBy: { startAt: 'asc' } })
  return NextResponse.json({ shifts: rows })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { csv } = await req.json().catch(() => ({ csv: '' })) as { csv?: string }
  if (!csv) return NextResponse.json({ error: 'Missing csv' }, { status: 400 })

  const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  let imported = 0
  for (const line of lines) {
    const [therapistEmail, studentName, startIso, endIso] = line.split(',').map(s => s?.trim())
    if (!therapistEmail || !startIso || !endIso) continue
    const therapist = await prisma.user.findUnique({ where: { email: therapistEmail } })
    if (!therapist) continue
    const startAt = new Date(startIso)
    const endAt = new Date(endIso)
    let studentId: string | undefined
    if (studentName) {
      const st = await prisma.student.findFirst({ where: { name: studentName } })
      if (st) studentId = st.id
    }
  await (prisma as any).workShift.create({ data: { therapistId: therapist.id, studentId: studentId || null, startAt, endAt, status: 'SCHEDULED' } })
    imported++
  }
  return NextResponse.json({ imported })
}
