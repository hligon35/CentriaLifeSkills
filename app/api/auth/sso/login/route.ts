import { NextRequest, NextResponse } from 'next/server'
import { buildAuthorizeUrl, getOIDCConfig } from '@/lib/oidc'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const check = req.nextUrl.searchParams.get('check')
  const returnTo = req.nextUrl.searchParams.get('returnTo') || '/'
  const isProd = String(process.env.NODE_ENV) === 'production'

  // Config check should not attempt DB/login
  if (check) {
    if (!isProd) return NextResponse.json({ configured: true })
    try {
      getOIDCConfig()
      return NextResponse.json({ configured: true })
    } catch {
      return NextResponse.json({ configured: false })
    }
  }
  // Dev/test shortcut: instantly authenticate and redirect
  if (!isProd) {
    const roleParam = (req.nextUrl.searchParams.get('role') || '').toUpperCase()
    let role: 'THERAPIST' | 'PARENT' | 'ADMIN' | null = null
    // Infer role from returnTo path when not explicitly provided
    try {
      const rtPath = new URL(returnTo, req.url).pathname
      if (rtPath.startsWith('/therapist')) role = 'THERAPIST'
      else if (rtPath.startsWith('/parent')) role = 'PARENT'
      else if (rtPath.startsWith('/admin')) role = 'ADMIN'
    } catch {
      // ignore
    }
    if (!role) {
      role = (['THERAPIST', 'PARENT', 'ADMIN'] as const).includes(roleParam as any)
        ? (roleParam as 'THERAPIST' | 'PARENT' | 'ADMIN')
        : 'PARENT'
    }
    const email = role === 'THERAPIST'
      ? 'therapist@example.com'
      : role === 'ADMIN'
      ? 'admin@example.com'
      : 'parent@example.com'
    let sub = `dev-${role.toLowerCase()}`
    let name = role.charAt(0) + role.slice(1).toLowerCase()
    try {
      const user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        sub = user.id
        name = user.name || name
      }
    } catch {
      // Fallback to stub user id
    }
    const token = await signJwt({ sub, role: role as any, name })
    cookies().set('token', token, { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/' })
    const dest = new URL(returnTo || '/', req.url)
    return NextResponse.redirect(dest)
  }
  try {
    // Will throw if not configured
    getOIDCConfig()
    const state = Math.random().toString(36).slice(2)
    const url = buildAuthorizeUrl(state)
    const target = returnTo
    if (check) return NextResponse.json({ configured: true, url, returnTo: target })
    // Note: In production you should store state in a cookie to validate it on callback.
    const redir = new URL(url)
    // carry returnTo via state or query for dev convenience (non-secure)
    redir.searchParams.set('state', state + '|' + encodeURIComponent(target))
    return NextResponse.redirect(redir)
  } catch {
    if (check) return NextResponse.json({ configured: false })
    return NextResponse.json({ error: 'SSO not configured' }, { status: 400 })
  }
}
