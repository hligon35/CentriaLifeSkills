import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import argon2 from 'argon2'
import { LoginSchema } from '@/lib/validation'
import { signJwt } from '@/lib/auth'

// using shared prisma client

export async function POST(req: NextRequest) {
  try {
    let json: unknown
    try {
      json = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const parsed = LoginSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const ok = await argon2.verify(user.passwordHash, parsed.data.password)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = await signJwt({ sub: user.id, role: user.role as any, name: user.name || undefined })
    const isProd = process.env.NODE_ENV === 'production'
    const host = req.nextUrl.hostname
    const isLocalHost = host === 'localhost' || host === '127.0.0.1'
    const allowInsecureLocal = process.env.ALLOW_INSECURE_LOCAL === '1'
    const secureCookie = isProd && !isLocalHost && !allowInsecureLocal
    cookies().set('token', token, { httpOnly: true, secure: secureCookie, sameSite: 'strict', path: '/' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    // Avoid leaking details; return generic error
    // Log server-side details for ops (Sentry, logs) without leaking to client
    console.error('[auth/login] internal error')
    console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
