import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const me = await getSession()
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await prisma.appSetting.findMany()
  const settings = Object.fromEntries(items.map(i => [i.key, i.value]))
  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const me = await getSession()
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as Record<string, string>
  const entries = Object.entries(body)
  if (entries.length === 0) return NextResponse.json({ ok: true })
  await prisma.$transaction(entries.map(([key, value]) => prisma.appSetting.upsert({
    where: { key },
    update: { value: String(value ?? '') },
    create: { key, value: String(value ?? '') },
  })))
  return NextResponse.json({ ok: true })
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await prisma.appSetting.findMany({})
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return NextResponse.json({ settings })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json().catch(() => ({})) as Record<string, unknown>
  const entries = Object.entries(json).filter(([k, v]) => typeof k === 'string' && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'))
  if (entries.length === 0) return NextResponse.json({ error: 'No valid settings' }, { status: 400 })
  for (const [key, val] of entries) {
    await prisma.appSetting.upsert({ where: { key }, update: { value: String(val) }, create: { key, value: String(val) } })
  }
  return NextResponse.json({ ok: true })
}
