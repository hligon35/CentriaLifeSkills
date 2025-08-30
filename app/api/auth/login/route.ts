import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import argon2 from 'argon2'
import { LoginSchema } from '@/lib/validation'
import { signJwt } from '@/lib/auth'

// using shared prisma client

export async function POST(req: NextRequest) {
  const json = await req.json()
  const parsed = LoginSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const ok = await argon2.verify(user.passwordHash, parsed.data.password)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const token = await signJwt({ sub: user.id, role: user.role as any, name: user.name || undefined })
  const isProd = process.env.NODE_ENV === 'production'
  cookies().set('token', token, { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/' })
  return NextResponse.json({ ok: true })
}
