import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// Link an uploaded media URL to an existing message as an attachment
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { messageId, url, mimeType, duration } = await req.json().catch(() => ({}))
  if (!messageId || !url || !mimeType) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const msg = await prisma.message.findUnique({ where: { id: messageId } })
  if (!msg || (msg.senderId !== user.sub && msg.receiverId !== user.sub && user.role !== 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const att = await prisma.messageAttachment.create({ data: { messageId, url, mimeType, duration: typeof duration === 'number' ? duration : null } })
  return NextResponse.json(att, { status: 201 })
}
