import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { prisma as db } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const s = await db.appSetting.findUnique({ where: { key: 'board.allowLikes' } })
  if ((s?.value || 'true').toLowerCase() !== 'true') return NextResponse.json({ error: 'Likes disabled' }, { status: 403 })
  const { postId } = await req.json()
  if (!postId || typeof postId !== 'string') return NextResponse.json({ error: 'Invalid postId' }, { status: 400 })
  const key = { postId_userId: { postId, userId: user.sub } } as const
  const exists = await prisma.postLike.findUnique({ where: key })
  if (exists) {
    await prisma.postLike.delete({ where: key })
  } else {
    await prisma.postLike.create({ data: { postId, userId: user.sub } })
  }
  const likes = await prisma.postLike.findMany({ where: { postId } })
  return NextResponse.json({ likes })
}
