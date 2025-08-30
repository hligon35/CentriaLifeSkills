import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET: return active memos for current user (by role or targeted), not expired
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ memos: [] })
  const now = new Date()
  const memos = await prisma.urgentMemo.findMany({
    where: {
      active: true,
      OR: [
        { audience: 'ALL' },
        { audience: user.role },
        { audience: 'USER', targetUserId: user.sub }
      ],
      AND: [
        { OR: [ { expiresAt: null }, { expiresAt: { gt: now } } ] }
      ]
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json({ memos })
}

// Admin create/update/delete
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const created = await prisma.urgentMemo.create({ data: {
    title: String(json.title || '').slice(0, 200),
    body: String(json.body || '').slice(0, 5000),
    active: Boolean(json.active ?? true),
    audience: String(json.audience || 'ALL'),
    targetUserId: json.targetUserId || null,
    expiresAt: json.expiresAt ? new Date(json.expiresAt) : null
  }})
  return NextResponse.json(created, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const updated = await prisma.urgentMemo.update({ where: { id: json.id }, data: {
    title: json.title,
    body: json.body,
    active: json.active,
    audience: json.audience,
    targetUserId: json.targetUserId ?? null,
    expiresAt: json.expiresAt ? new Date(json.expiresAt) : null
  }})
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.urgentMemo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
