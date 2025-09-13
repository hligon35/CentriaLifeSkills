import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  const { role } = await req.json()
  if (!['THERAPIST', 'PARENT', 'ADMIN'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  const email = role === 'THERAPIST' ? 'therapist@example.com' : role === 'ADMIN' ? 'admin@example.com' : 'parent@example.com'
  let sub = `dev-${String(role).toLowerCase()}`
  let name = (role === 'ADMIN' ? 'Admin' : role === 'THERAPIST' ? 'Therapist' : 'Parent')
  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null)
  if (user) { sub = user.id; name = user.name || name }
  const token = await signJwt({ sub, role: role as any, name })
  const isProd = String(process.env.NODE_ENV) === 'production'
  cookies().set('token', token, { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/' })
  return NextResponse.json({ ok: true })
}
