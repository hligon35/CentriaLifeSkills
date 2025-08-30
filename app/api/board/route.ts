import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { PostCreateSchema, sanitize } from '@/lib/validation'

// using shared prisma client

export async function GET() {
  const posts = await prisma.post.findMany({ include: { comments: true, likes: true }, orderBy: { createdAt: 'desc' }, take: 25 })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = PostCreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const p = await prisma.post.create({ data: { authorId: user.sub, title: sanitize(parsed.data.title), body: sanitize(parsed.data.body) } })
  return NextResponse.json(p, { status: 201 })
}
