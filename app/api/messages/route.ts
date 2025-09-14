import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { MessageCreateSchema, sanitize } from '@/lib/validation'

// using shared prisma client

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const cursorId = searchParams.get('cursor') || undefined
  const take = Math.min(Number(searchParams.get('take') || 50), 100)
  const isProd = String(process.env.NODE_ENV) === 'production'
  try {
    let where: any
    if (user.role === 'ADMIN') {
      where = {}
    } else if (user.role === 'THERAPIST') {
      // Therapist can view messages between parent of their student and therapists (AM/PM) assigned to that student
      const students = await prisma.student.findMany({ where: { OR: [{ amTherapistId: user.sub }, { pmTherapistId: user.sub }] } })
      const parentIds = students.map((s: { parentId: string }) => s.parentId)
      const therapistIds = students.flatMap((s: { amTherapistId: string; pmTherapistId: string }) => [s.amTherapistId, s.pmTherapistId])
      where = {
        OR: [
          ...parentIds.flatMap((pid: string) => therapistIds.map((tid: string) => ({ AND: [{ senderId: pid }, { receiverId: tid }] }))),
          ...parentIds.flatMap((pid: string) => therapistIds.map((tid: string) => ({ AND: [{ senderId: tid }, { receiverId: pid }] })))
        ]
      }
    } else {
      // Parent can view their own conversations
      where = { OR: [{ senderId: user.sub }, { receiverId: user.sub }] }
    }
    const msgs = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      take,
      include: {
        sender: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        receiver: { select: { id: true, name: true, email: true, role: true, photoUrl: true } }
      }
    })
    const nextCursor = msgs.length === take ? msgs[msgs.length - 1]?.id : undefined
    return NextResponse.json({ items: msgs, nextCursor })
  } catch (e) {
    if (!isProd) {
      return NextResponse.json({ items: [], nextCursor: undefined })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = MessageCreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const created = await prisma.message.create({
    data: {
      senderId: user.sub,
      receiverId: parsed.data.receiverId,
      content: sanitize(parsed.data.content), // if E2EE, send ciphertext, otherwise sanitize content
      mediaUrl: parsed.data.mediaUrl,
      mediaType: parsed.data.mediaType,
      iv: parsed.data.iv,
      channel: 'DIRECT'
    }
  })
  return NextResponse.json(created, { status: 201 })
}
