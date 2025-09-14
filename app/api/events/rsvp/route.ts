import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { RsvpSchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = RsvpSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const { eventId, status, comment } = parsed.data
  const r = await prisma.eventRsvp.upsert({ where: { eventId_userId: { eventId, userId: user.sub } }, update: { status, comment: comment ?? null }, create: { eventId, userId: user.sub, status, comment: comment ?? null } })
  return NextResponse.json(r)
}
