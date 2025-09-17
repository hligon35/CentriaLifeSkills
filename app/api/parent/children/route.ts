import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const me = await getSession()
  if (!me || me.role !== 'PARENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const kids = await prisma.student.findMany({ where: { parentId: me.sub }, select: { id: true, name: true } })
  return NextResponse.json({ items: kids })
}
