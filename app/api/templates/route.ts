// Templates API removed. Keeping file to avoid 404 in routes during cleanup.
// Returning 410 Gone for any access.
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Templates feature removed' }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: 'Templates feature removed' }, { status: 410 })
}
