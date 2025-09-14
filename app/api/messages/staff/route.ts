import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { sanitize } from '@/lib/validation'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role === 'PARENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const items = await prisma.message.findMany({ where: { channel: 'STAFF' }, orderBy: { createdAt: 'desc' }, take: 100, include: { sender: true } })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role === 'PARENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { content } = await req.json()
  if (!content || typeof content !== 'string') return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const created = await prisma.message.create({ data: { senderId: user.sub, receiverId: user.sub, content: sanitize(content), channel: 'STAFF' } })
  return NextResponse.json(created, { status: 201 })
}
