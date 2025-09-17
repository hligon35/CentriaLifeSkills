import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function absolutize(base: string, url?: string | null) {
  if (!url) return undefined
  try {
    return new URL(url, base).toString()
  } catch { return undefined }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get('url') || ''
  try {
    const u = new URL(target)
    if (!/^https?:$/.test(u.protocol)) throw new Error('Invalid protocol')
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
  try {
  // Enforce allowlist if configured
  const s = await prisma.appSetting.findMany({ where: { key: { in: ['board.richPreview.enabled','board.richPreview.allowedDomains'] } } })
  const map = Object.fromEntries(s.map((r: { key: string; value: string }) => [r.key, r.value])) as Record<string,string>
  const enabled = (map['board.richPreview.enabled'] || 'true').toLowerCase() === 'true'
  const allow = (map['board.richPreview.allowedDomains'] || '').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)
  const host = new URL(target).hostname.toLowerCase()
  if (!enabled) return NextResponse.json({})
  if (allow.length && !allow.some(dom => host === dom || host.endsWith('.'+dom))) return NextResponse.json({})
  const res = await fetch(target, { redirect: 'follow', headers: { 'User-Agent': 'BuddyBoard/1.0 (+https://example.org)' } })
    const html = await res.text()
    // Basic size guard
    const snippet = html.slice(0, 200000)
    const og = {
      title: /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["'][^>]*>/i.exec(snippet)?.[1] || undefined,
      description: /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["'][^>]*>/i.exec(snippet)?.[1] || undefined,
      image: /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i.exec(snippet)?.[1] || undefined,
      siteName: /<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["'][^>]*>/i.exec(snippet)?.[1] || undefined,
    }
    // Fallbacks using standard meta
    const title = og.title || /<title[^>]*>([^<]+)<\/title>/i.exec(snippet)?.[1]
    const desc = og.description || /<meta\s+name=["']description["']\s+content=["']([^"']+)["'][^>]*>/i.exec(snippet)?.[1]
    const image = og.image
    const siteName = og.siteName || (() => { try { return new URL(target).hostname } catch { return undefined } })()
    const safe = {
      title: title?.slice(0, 200),
      description: desc?.slice(0, 300),
      image: absolutize(target, image),
      siteName,
    }
    return NextResponse.json(safe)
  } catch {
    return NextResponse.json({}, { status: 200 })
  }
}
