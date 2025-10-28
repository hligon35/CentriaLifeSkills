import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import argon2 from 'argon2'

function checkToken(req: NextRequest) {
  const cfg = process.env.ADMIN_MAINT_TOKEN
  if (!cfg) return false
  const h = req.headers.get('x-maint-token') || ''
  const url = new URL(req.url)
  const q = url.searchParams.get('token') || ''
  return h === cfg || q === cfg
}

export async function POST(req: NextRequest) {
  if (!checkToken(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const pass = await argon2.hash('Password123!')
    const [therapist, parent, admin] = await Promise.all([
      prisma.user.upsert({ where: { email: 'therapist@example.com' }, update: {}, create: { email: 'therapist@example.com', name: 'Therapist Alice', role: 'THERAPIST', passwordHash: pass } }),
      prisma.user.upsert({ where: { email: 'parent@example.com' }, update: {}, create: { email: 'parent@example.com', name: 'Parent Bob', role: 'PARENT', passwordHash: pass } }),
      prisma.user.upsert({ where: { email: 'admin@example.com' }, update: {}, create: { email: 'admin@example.com', name: 'Admin User', role: 'ADMIN', passwordHash: pass } }),
    ])
    return NextResponse.json({ ok: true, users: { therapist: therapist.email, parent: parent.email, admin: admin.email } })
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
