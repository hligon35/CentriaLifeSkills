import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  const { role } = await req.json()
  if (!['THERAPIST', 'PARENT'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  const email = role === 'THERAPIST' ? 'therapist@example.com' : 'parent@example.com'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: 'Seed users missing' }, { status: 400 })
  const token = await signJwt({ sub: user.id, role: user.role as any, name: user.name || undefined })
  const isProd = String(process.env.NODE_ENV) === 'production'
  cookies().set('token', token, { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/' })
  return NextResponse.json({ ok: true })
}
