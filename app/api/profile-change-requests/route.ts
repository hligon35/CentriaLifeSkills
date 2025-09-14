import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'THERAPIST') return NextResponse.json({ error: 'Only therapists can request changes' }, { status: 403 })
  const payload = await req.json().catch(() => null)
  if (!payload || typeof payload !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const fieldsJson = JSON.stringify(payload)
  // Using indexer to avoid transient TS type mismatch if Prisma Client types haven't refreshed in the editor
  const r = await (prisma as any).profileChangeRequest.create({ data: { userId: user.sub, fieldsJson } })
  return NextResponse.json({ request: r })
}
