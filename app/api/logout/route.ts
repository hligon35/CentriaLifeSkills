import { NextResponse } from 'next/server'

// Clears auth cookie (assuming 'token' cookie used for session/JWT) and redirects client side.
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
