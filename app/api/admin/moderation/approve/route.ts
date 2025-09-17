import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const me = await getSession()
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { postId } = await req.json().catch(() => ({ postId: '' })) as { postId: string }
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
  // Fetch post first to get author and title
  const current = await prisma.post.findUnique({ where: { id: postId } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const post = await prisma.post.update({ where: { id: postId }, data: { published: true, publishAt: null } }).catch(() => null)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.auditLog.create({ data: { userId: me.sub, action: 'POST_APPROVE', entity: 'Post', entityId: postId } })
  // Notify author
  await prisma.notification.create({ data: {
    userId: current.authorId,
    type: 'POST_APPROVED',
    payload: JSON.stringify({ postId: current.id, title: current.title }),
    channel: 'in-app',
    status: 'queued',
  } })
  return NextResponse.json({ ok: true })
}
