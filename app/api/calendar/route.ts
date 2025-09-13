import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/calendar?month=YYYY-MM (optional), returns events visible to current user by role
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ events: [] })
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  let start: Date | undefined
  let end: Date | undefined
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    start = new Date(y, m - 1, 1)
    end = new Date(y, m, 1)
  }
  const isProd = String(process.env.NODE_ENV) === 'production'
  try {
    const where: any = {
      AND: [
        start ? { startAt: { gte: start } } : {},
        end ? { startAt: { lt: end } } : {},
        { OR: [ { audience: 'ALL' }, { audience: user.role } ] }
      ]
    }
    const events = await prisma.event.findMany({ where, orderBy: { startAt: 'asc' } })
    return NextResponse.json({ events })
  } catch (e) {
    if (!isProd) {
      // Simple dev fallback: no events instead of 500
      return NextResponse.json({ events: [] })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Admin create/update/delete
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const evt = await prisma.event.create({ data: {
    title: String(json.title || '').slice(0, 200),
    description: json.description ? String(json.description).slice(0, 2000) : null,
    audience: String(json.audience || 'ALL'),
    startAt: new Date(json.startAt),
    // endAt is non-nullable in schema, so if not provided, default to startAt
    endAt: new Date(json.endAt ? json.endAt : json.startAt),
    location: json.location ? String(json.location).slice(0, 200) : null,
  } })
  return NextResponse.json(evt, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const evt = await prisma.event.update({ where: { id: String(json.id || '') }, data: {
    title: json.title,
    description: json.description ?? null,
    audience: json.audience,
    startAt: json.startAt ? new Date(json.startAt) : undefined,
    endAt: json.endAt ? new Date(json.endAt) : (json.startAt ? new Date(json.startAt) : undefined),
    location: json.location ?? null,
  } })
  return NextResponse.json(evt)
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.event.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
