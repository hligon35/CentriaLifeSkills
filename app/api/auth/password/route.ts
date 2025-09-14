import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import argon2 from 'argon2'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { currentPassword, newPassword } = await req.json().catch(() => ({})) as { currentPassword?: string; newPassword?: string }
  if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub }, select: { passwordHash: true } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const ok = await argon2.verify(dbUser.passwordHash, currentPassword)
  if (!ok) return NextResponse.json({ error: 'Invalid current password' }, { status: 400 })
  const hash = await argon2.hash(newPassword)
  await prisma.user.update({ where: { id: user.sub }, data: { passwordHash: hash } })
  return NextResponse.json({ ok: true })
}
