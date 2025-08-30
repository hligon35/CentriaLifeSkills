import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// using shared prisma client

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await prisma.notification.findMany({ where: { userId: user.sub }, orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  // json: { userId, type, payload, channel }
  const created = await prisma.notification.create({ data: { userId: json.userId, type: json.type, payload: json.payload, channel: json.channel ?? 'in-app', status: 'queued' } })
  // Dispatch via provider here: SendGrid or Twilio. // Insert provider configuration and mapping here.
  return NextResponse.json(created, { status: 201 })
}
