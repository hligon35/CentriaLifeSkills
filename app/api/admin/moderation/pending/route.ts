import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const me = await getSession()
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')))
  const category = url.searchParams.get('category') || undefined
  const author = url.searchParams.get('author') || undefined
  const where: any = { published: false, ...(category ? { category } : {}), ...(author ? { authorId: author } : {}) }
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
    orderBy: { createdAt: 'desc' },
    include: { author: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ])
  return NextResponse.json({ posts, page, pageSize, total })
}
