import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
