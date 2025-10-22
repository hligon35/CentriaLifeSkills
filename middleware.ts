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
  // Single entrypoint logic:
  // 1. Unauthenticated: any protected or root/page access (except /login and public assets) -> /login with returnTo
  // 2. Authenticated: /login should bounce to role home
  const isLogin = path === '/login'
  const isRegister = path === '/register'
  const isPublicAsset = path.startsWith('/_next') || path.startsWith('/favicon') || path.startsWith('/icons') || path.startsWith('/api/auth') || isRegister
  let user: any = null
  if (token) {
    try { user = await verifyJwt(token) } catch { user = null }
  }
  // If user hits root '/', direct them to the appropriate place
  if (path === '/') {
    if (user) {
      const roleHome: string = user.role === 'ADMIN' ? '/admin' : user.role === 'THERAPIST' ? '/therapist' : user.role === 'PARENT' ? '/parent' : '/login'
      if (roleHome !== '/') return NextResponse.redirect(new URL(roleHome, req.url))
    } else {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  if (user && (isLogin || isRegister)) {
    const roleHome: string = user.role === 'ADMIN' ? '/admin' : user.role === 'THERAPIST' ? '/therapist' : user.role === 'PARENT' ? '/parent' : '/'
    return NextResponse.redirect(new URL(roleHome, req.url))
  }
  if (!user && !isLogin && !isPublicAsset) {
    // Allow unauth access to API login endpoints; everything else goes to /login
    if (!path.startsWith('/api')) {
      const loginUrl = new URL('/login', req.url)
      const returnTo = path + (url.search || '')
      loginUrl.searchParams.set('returnTo', returnTo)
      return NextResponse.redirect(loginUrl)
    }
  }
  const protectedPrefixes = ['/therapist', '/parent', '/chat', '/board', '/notifications', '/settings', '/admin']
  const isProtected = protectedPrefixes.some(p => path.startsWith(p))
  const makeLoginRedirect = () => {
    const loginUrl = new URL('/login', req.url)
    const returnTo = path + (url.search || '')
    loginUrl.searchParams.set('returnTo', returnTo)
    return NextResponse.redirect(loginUrl)
  }
  if (isProtected) {
    if (!user) return makeLoginRedirect()
    if (path.startsWith('/therapist') && user.role !== 'THERAPIST') return makeLoginRedirect()
    if (path.startsWith('/parent') && user.role !== 'PARENT') return makeLoginRedirect()
    if (path.startsWith('/admin') && user.role !== 'ADMIN') return makeLoginRedirect()
  }

  const res = NextResponse.next()
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // Report-only CSP to observe violations before enforcement
  res.headers.set('Content-Security-Policy-Report-Only', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self' https: data:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'"
  ].join('; '))
  return res
}

export const config = {
  matcher: ['/', '/api/:path*', '/therapist/:path*', '/parent/:path*', '/chat', '/board', '/notifications', '/settings', '/admin/:path*']
}
