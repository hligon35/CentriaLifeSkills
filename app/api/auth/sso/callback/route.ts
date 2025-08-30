import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, fetchUserInfo } from '@/lib/oidc'
import { prisma } from '@/lib/prisma'
import { signJwt } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  try {
    const tokens = await exchangeCodeForTokens(code)
    const info = await fetchUserInfo(tokens.access_token)

    // Map OIDC user info to app roles. Adjust mapping as needed.
    const email = info.email || `${info.sub}@example-sso`
    const name = info.name || email.split('@')[0]
    // Default role PARENT; admins can later adjust in DB.
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name, role: 'PARENT', passwordHash: '' }
    })

    const token = await signJwt({ sub: user.id, role: user.role as any, name: user.name || undefined })
    const isProd = process.env.NODE_ENV === 'production'
    cookies().set('token', token, { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/' })
    return NextResponse.redirect(new URL('/', req.url))
  } catch (e) {
    return NextResponse.json({ error: 'SSO failed' }, { status: 400 })
  }
}
