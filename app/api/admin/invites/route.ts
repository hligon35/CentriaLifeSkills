import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/auth'
import { cookies } from 'next/headers'
import { z } from 'zod'
import crypto from 'crypto'

const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['THERAPIST','PARENT','ADMIN']),
  expiresInHours: z.number().int().min(1).max(720).optional()
})

export async function POST(req: NextRequest) {
  // Authn
  const token = cookies().get('token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let user: any = null
  try { user = await verifyJwt(token) } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const json = await req.json().catch(() => null)
  const parsed = CreateInviteSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const { email, role, expiresInHours } = parsed.data
  const tok = crypto.randomUUID().replace(/-/g, '')
  const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 3600_000) : null
  const invite = await prisma.invite.create({ data: { email, role, token: tok, createdById: user.sub, expiresAt } })
  return NextResponse.json({ token: invite.token })
}

export async function GET(req: NextRequest) {
  const token = cookies().get('token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let user: any = null
  try { user = await verifyJwt(token) } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const invites = await prisma.invite.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  return NextResponse.json({ invites })
}
