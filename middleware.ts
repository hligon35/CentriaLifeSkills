import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from './lib/auth'

const RATE = 60 // requests per minute per IP
const buckets = new Map<string, { count: number; reset: number }>()

export async function middleware(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const b = buckets.get(ip as string) || { count: 0, reset: now + 60_000 }
  if (now > b.reset) { b.count = 0; b.reset = now + 60_000 }
  b.count++
  buckets.set(ip as string, b)
  if (b.count > RATE) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }
  // Route protection and role gating
  const token = req.cookies.get('token')?.value
  const url = new URL(req.url)
  const path = url.pathname
  const protectedPrefixes = ['/therapist', '/parent', '/chat', '/board', '/notifications', '/settings', '/admin']
  const isProtected = protectedPrefixes.some(p => path.startsWith(p))
  const makeLoginRedirect = () => {
    const loginUrl = new URL('/login', req.url)
    const returnTo = path + (url.search || '')
    loginUrl.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(loginUrl)
  }
  if (isProtected) {
    if (!token) return makeLoginRedirect()
    try {
  const user = token ? await verifyJwt(token) : null
  if (path.startsWith('/therapist') && user?.role !== 'THERAPIST') return makeLoginRedirect()
  if (path.startsWith('/parent') && user?.role !== 'PARENT') return makeLoginRedirect()
  if (path.startsWith('/admin') && user?.role !== 'ADMIN') return makeLoginRedirect()
    } catch {
      return makeLoginRedirect()
    }
  }

  const res = NextResponse.next()
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return res
}

export const config = {
  matcher: ['/api/:path*', '/therapist/:path*', '/parent/:path*', '/chat', '/board', '/notifications', '/settings', '/admin/:path*']
}
