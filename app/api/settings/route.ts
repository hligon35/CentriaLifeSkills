import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

// Publicly readable app settings needed by clients (read-only)
export async function GET() {
  let map: Record<string, string> = {}
  try {
    const rows = await prisma.appSetting.findMany({ where: { key: { startsWith: 'board.' } } })
    map = Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value])) as Record<string, string>
  } catch (e: any) {
    // During static export or first boot, the table may not exist yet. Fall back to defaults.
    // Optionally log e.code === 'P2021' (table does not exist)
  }
  // Normalize to booleans/arrays where expected
  const bool = (v?: string) => (v || '').toLowerCase() === 'true'
  const list = (v?: string) => (v || '').split(',').map(s=>s.trim()).filter(Boolean)
  return NextResponse.json({
    'board.allowLikes': bool(map['board.allowLikes'] ?? 'true'),
    'board.allowComments': bool(map['board.allowComments'] ?? 'true'),
    'board.richPreview.enabled': bool(map['board.richPreview.enabled'] ?? 'true'),
    'board.richPreview.allowedDomains': list(map['board.richPreview.allowedDomains'] ?? ''),
    'board.autoUnpin.days': Number(map['board.autoUnpin.days'] ?? '0'),
    'board.moderation.required': bool(map['board.moderation.required'] ?? 'false'),
    'board.categories': list(map['board.categories'] ?? 'ANNOUNCEMENT,EVENT,NEWS,SAFETY,KUDOS'),
    'board.profanityFilter.enabled': bool(map['board.profanityFilter.enabled'] ?? 'false'),
    'board.profanityFilter.blocklist': list(map['board.profanityFilter.blocklist'] ?? ''),
  })
}
