import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { PostCreateSchema, sanitize } from '@/lib/validation'

// using shared prisma client

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || undefined
  const tag = searchParams.get('tag') || undefined
  const now = new Date()
  const where: any = {
    ...(category ? { category } : {}),
    ...(tag ? { OR: [ { tags: { contains: tag } } ] } : {}),
    OR: [
      { published: true },
      { publishAt: { lte: now } },
      // show unpublished to admins in future if needed (skipped here for simplicity)
    ],
  }
  const posts = await prisma.post.findMany({ where, include: { comments: true, likes: true }, orderBy: [ { pinned: 'desc' }, { createdAt: 'desc' } ], take: 50 })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = PostCreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const imageUrl = parsed.data.imageUrl ? String(parsed.data.imageUrl) : undefined
  const publishAt = (json as any).publishAt ? new Date((json as any).publishAt) : null
  const fileUrl = (json as any).fileUrl ? String((json as any).fileUrl) : null
  const published = (json as any).published === false ? false : (publishAt ? false : true)
  const p = await prisma.post.create({ data: {
    authorId: user.sub,
    title: sanitize(parsed.data.title),
    body: sanitize(parsed.data.body),
    imageUrl,
    fileUrl,
    pinned: Boolean(parsed.data.pinned ?? false),
    category: parsed.data.category ?? null,
    tags: parsed.data.tags && parsed.data.tags.length ? parsed.data.tags.join(',') : null,
    published,
    publishAt,
  } as any })
  return NextResponse.json(p, { status: 201 })
}
