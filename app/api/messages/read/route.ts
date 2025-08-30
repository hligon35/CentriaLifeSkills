import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
    return NextResponse.json({ error: 'Invalid ids' }, { status: 400 })
  }
  const result = await prisma.message.updateMany({ where: { id: { in: ids }, receiverId: user.sub, readAt: null }, data: { readAt: new Date() } })
  return NextResponse.json({ updated: result.count })
}
