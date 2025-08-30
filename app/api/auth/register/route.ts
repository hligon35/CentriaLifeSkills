import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import argon2 from 'argon2'
import { RegisterSchema } from '@/lib/validation'

// using shared prisma client

export async function POST(req: NextRequest) {
  const json = await req.json()
  const parsed = RegisterSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const hash = await argon2.hash(parsed.data.password)
  const user = await prisma.user.create({
    data: { email: parsed.data.email, passwordHash: hash, name: parsed.data.name, role: parsed.data.role }
  })
  return NextResponse.json({ id: user.id })
}
