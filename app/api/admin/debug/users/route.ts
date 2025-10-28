import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function checkToken(req: NextRequest) {
  const cfg = process.env.ADMIN_MAINT_TOKEN
  if (!cfg) return false
  const h = req.headers.get('x-maint-token') || ''
  const url = new URL(req.url)
  const q = url.searchParams.get('token') || ''
  return h === cfg || q === cfg
}

export async function GET(req: NextRequest) {
  if (!checkToken(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const [count, therapist, parent, admin] = await Promise.all([
      prisma.user.count(),
      prisma.user.findUnique({ where: { email: 'therapist@example.com' } }),
      prisma.user.findUnique({ where: { email: 'parent@example.com' } }),
      prisma.user.findUnique({ where: { email: 'admin@example.com' } }),
    ])
    return NextResponse.json({
      ok: true,
      totalUsers: count,
      exists: {
        therapist: Boolean(therapist),
        parent: Boolean(parent),
        admin: Boolean(admin),
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
