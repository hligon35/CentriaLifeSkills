import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { CommentCreateSchema, sanitize } from '@/lib/validation'

// using shared prisma client

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = CommentCreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const c = await prisma.comment.create({ data: { authorId: user.sub, postId: parsed.data.postId, body: sanitize(parsed.data.body) } })
  return NextResponse.json(c, { status: 201 })
}
