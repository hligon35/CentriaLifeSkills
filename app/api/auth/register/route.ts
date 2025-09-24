import { NextRequest, NextResponse } from 'next/server'
import argon2 from 'argon2'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/auth'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Env gate: allow open self-registration (non-invite) when set
const ALLOW_OPEN = process.env.ALLOW_OPEN_REG === '1'

// Flexible schema: token path or open path
const IncomingRegisterSchema = z.object({
  token: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['THERAPIST','PARENT','ADMIN']).optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    const parsed = IncomingRegisterSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const { token, email: formEmail, name, password, role: formRole } = parsed.data

    let email = formEmail
    let role = formRole
    let invite: any = null

    if (token) {
      invite = await prisma.invite.findUnique({ where: { token } })
      if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 400 })
      if (invite.consumedAt) return NextResponse.json({ error: 'Invite already used' }, { status: 400 })
      if (invite.expiresAt && invite.expiresAt < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 400 })
      email = invite.email
      role = invite.role
    } else {
      if (!ALLOW_OPEN) return NextResponse.json({ error: 'Registration requires invite' }, { status: 403 })
      if (!email || !role) return NextResponse.json({ error: 'Email and role required' }, { status: 400 })
      if (role === 'ADMIN') return NextResponse.json({ error: 'Cannot self-register admin' }, { status: 403 })
    }

    if (!email || !role) return NextResponse.json({ error: 'Resolution failure' }, { status: 500 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    const passwordHash = await argon2.hash(password)
    const user = await prisma.user.create({ data: { email, name, role, passwordHash } })
    if (invite) {
      await prisma.invite.update({ where: { token }, data: { consumedAt: new Date(), consumedById: user.id } })
    }
    const jwt = await signJwt({ sub: user.id, role: role as any, name: user.name || undefined })
    const isProd = process.env.NODE_ENV === 'production'
    cookies().set('token', jwt, { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
