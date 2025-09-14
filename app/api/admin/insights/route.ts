import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [messages, posts, comments, events] = await Promise.all([
    prisma.message.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.event.count(),
  ])
  return NextResponse.json({ messages, posts, comments, events })
}
