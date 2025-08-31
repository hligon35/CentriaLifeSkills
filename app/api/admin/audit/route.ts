import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const me = await getSession()
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
  return NextResponse.json({ logs })
}
