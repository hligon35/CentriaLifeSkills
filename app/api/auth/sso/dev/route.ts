import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  // Allow enabling this dev shortcut in production only if an explicit override env var is set.
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_SSO) {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  }
  const { role } = await req.json()
  if (!['THERAPIST', 'PARENT', 'ADMIN'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  const email = role === 'THERAPIST' ? 'therapist@example.com' : role === 'ADMIN' ? 'admin@example.com' : 'parent@example.com'
  let sub = `dev-${String(role).toLowerCase()}`
  let name = (role === 'ADMIN' ? 'Admin' : role === 'THERAPIST' ? 'Therapist' : 'Parent')
  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null)
  if (user) { sub = user.id; name = user.name || name }
  const token = await signJwt({ sub, role: role as any, name })
  const isProd = String(process.env.NODE_ENV) === 'production'
  const host = req.nextUrl.hostname
  const isLocalHost = host === 'localhost' || host === '127.0.0.1'
  const allowInsecureLocal = process.env.ALLOW_INSECURE_LOCAL === '1'
  const secureCookie = isProd && !isLocalHost && !allowInsecureLocal
  cookies().set('token', token, { httpOnly: true, secure: secureCookie, sameSite: 'strict', path: '/' })
  const res = NextResponse.json({ ok: true })
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_SSO) {
    res.headers.set('Warning', '199 - Dev SSO override active; remove ALLOW_DEV_SSO to disable')
  }
  return res
}
