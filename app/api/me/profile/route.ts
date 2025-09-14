import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const u = await prisma.user.findUnique({ where: { id: user.sub }, select: { id: true, email: true, name: true, photoUrl: true, language: true, role: true } })
  return NextResponse.json({ user: u })
}

export async function PATCH(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as Partial<{ email: string; name: string; photoUrl: string | null; language: string | null }>
  // Parents can update directly; therapists cannot (must submit request)
  if (user.role === 'THERAPIST') {
    return NextResponse.json({ error: 'Therapists must submit a change request' }, { status: 403 })
  }
  try {
    const updated = await prisma.user.update({ where: { id: user.sub }, data: { email: body.email ?? undefined, name: body.name ?? undefined, photoUrl: body.photoUrl ?? undefined, language: body.language ?? undefined }, select: { id: true, email: true, name: true, photoUrl: true, language: true } })
    return NextResponse.json({ user: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Update failed' }, { status: 400 })
  }
}
