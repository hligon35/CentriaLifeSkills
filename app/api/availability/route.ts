import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { AvailabilitySchema } from '@/lib/validation'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'THERAPIST' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await prisma.therapistAvailability.findMany({ where: { therapistId: user.sub }, orderBy: { weekday: 'asc' } })
  return NextResponse.json({ items: rows })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'THERAPIST' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const json = await req.json()
  const parsed = AvailabilitySchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const created = await prisma.therapistAvailability.create({ data: { therapistId: user.sub, ...parsed.data } })
  return NextResponse.json(created, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'THERAPIST' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.therapistAvailability.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
