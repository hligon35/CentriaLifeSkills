import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { TemplateCreateSchema, sanitize } from '@/lib/validation'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ items: [] })
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') || undefined
  const q = searchParams.get('q') || undefined
  const where: any = { ...(scope ? { scope } : {}), ...(q ? { OR: [ { title: { contains: q, mode: 'insensitive' } }, { tags: { contains: q, mode: 'insensitive' } } ] } : {}) }
  const items = await prisma.messageTemplate.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = TemplateCreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const t = await prisma.messageTemplate.create({ data: { title: sanitize(parsed.data.title), body: sanitize(parsed.data.body), tags: parsed.data.tags?.join(',') || null, scope: parsed.data.scope || 'ALL', createdById: user.sub } })
  return NextResponse.json(t, { status: 201 })
}
