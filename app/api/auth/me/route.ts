import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ user: null })
  // also include top-level role for older clients
  return NextResponse.json({ user, role: user.role })
}
