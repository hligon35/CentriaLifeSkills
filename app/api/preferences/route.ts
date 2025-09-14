import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { PreferenceSchema } from '@/lib/validation'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await prisma.notificationPreference.findMany({ where: { userId: user.sub } })
  return NextResponse.json({ items: rows })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = PreferenceSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const { key, value } = parsed.data
  const pref = await prisma.notificationPreference.upsert({ where: { userId_key: { userId: user.sub, key } }, update: { value }, create: { userId: user.sub, key, value } })
  return NextResponse.json(pref)
}
