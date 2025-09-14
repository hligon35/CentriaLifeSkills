import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ counts: { direct: 0, staff: 0 } })
  const [direct, staff] = await Promise.all([
    prisma.message.count({ where: { receiverId: user.sub, readAt: null, channel: 'DIRECT' } }),
    prisma.message.count({ where: { channel: 'STAFF', createdAt: { gt: new Date(Date.now() - 1000*60*60*24*7) } } }) // naive recent staff messages
  ])
  return NextResponse.json({ counts: { direct, staff } })
}
