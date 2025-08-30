import { NextRequest, NextResponse } from 'next/server'
import { buildAuthorizeUrl, getOIDCConfig } from '@/lib/oidc'

export async function GET(req: NextRequest) {
  const check = req.nextUrl.searchParams.get('check')
  try {
    // Will throw if not configured
    getOIDCConfig()
    const state = Math.random().toString(36).slice(2)
    const url = buildAuthorizeUrl(state)
    if (check) return NextResponse.json({ configured: true, url })
    // Note: In production you should store state in a cookie to validate it on callback.
    return NextResponse.redirect(url)
  } catch {
    if (check) return NextResponse.json({ configured: false })
    return NextResponse.json({ error: 'SSO not configured' }, { status: 400 })
  }
}
