import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/directory/staff?search=...&role=THERAPIST|ADMIN
// RBAC:
// - ADMIN: can list any role (default THERAPIST)
// - THERAPIST: can list THERAPIST only (limited fields)
// - PARENT: forbidden
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('search') || '').trim()
  const requestedRole = (searchParams.get('role') || 'THERAPIST').toUpperCase()

  if (user.role === 'PARENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const roleFilter = user.role === 'ADMIN' ? requestedRole : 'THERAPIST'

  const where: any = {
    role: roleFilter,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  // THERAPIST sees a limited projection; ADMIN can see email too
  const select = user.role === 'ADMIN'
    ? { id: true, name: true, email: true, role: true, photoUrl: true }
    : { id: true, name: true, role: true, photoUrl: true }

  const staff = await prisma.user.findMany({ where, select, orderBy: { name: 'asc' } })
  return NextResponse.json({ staff })
}
