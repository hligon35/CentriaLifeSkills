import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { postId, pinned } = await req.json()
  if (!postId || typeof pinned !== 'boolean') return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  await prisma.post.update({ where: { id: postId }, data: { pinned } })
  return NextResponse.json({ ok: true })
}
