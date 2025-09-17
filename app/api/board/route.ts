import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { PostCreateSchema, sanitize } from '@/lib/validation'
import { prisma as db } from '@/lib/prisma'

// using shared prisma client

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || undefined
  const tag = searchParams.get('tag') || undefined
  const now = new Date()
  const where: any = {
    ...(category ? { category } : {}),
    ...(tag ? { OR: [ { tags: { contains: tag } } ] } : {}),
    OR: [
      { published: true },
      { publishAt: { lte: now } },
      // show unpublished to admins in future if needed (skipped here for simplicity)
    ],
  }
  // Auto-unpin based on setting
  const set = await db.appSetting.findMany({ where: { key: { in: ['board.autoUnpin.days'] } } })
  const autoUnpinDays = Number((set.find((s: { key: string; value: string }) => s.key==='board.autoUnpin.days')?.value) || '0') || 0
  if (autoUnpinDays > 0) {
    const cutoff = new Date(Date.now() - autoUnpinDays*24*60*60*1000)
    await db.post.updateMany({ where: { pinned: true, createdAt: { lt: cutoff } }, data: { pinned: false } })
  }
  const posts = await prisma.post.findMany({ where, include: { comments: true, likes: true }, orderBy: [ { pinned: 'desc' }, { createdAt: 'desc' } ], take: 50 })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = PostCreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  // Enforce moderation + profanity filters
  const settings = await db.appSetting.findMany({ where: { key: { in: [
    'board.moderation.required',
    'board.moderation.required.therapist',
    'board.moderation.required.parent',
    'board.profanityFilter.enabled',
    'board.profanityFilter.blocklist'
  ] } } })
  const s = Object.fromEntries(settings.map((x: { key: string; value: string }) => [x.key, x.value])) as Record<string,string>
  const role = (user.role || '').toUpperCase()
  const moderationDefault = (s['board.moderation.required'] || 'false') === 'true'
  const moderationTherapist = (s['board.moderation.required.therapist'] || 'false') === 'true'
  const moderationParent = (s['board.moderation.required.parent'] || 'false') === 'true'
  // Per-user override list
  const userOverride = await db.appSetting.findUnique({ where: { key: `board.moderation.required.user:${user.sub}` } })
  const perUserRequired = (userOverride?.value || '').toLowerCase() === 'true'
  const moderationRequired = perUserRequired ? true : (role === 'THERAPIST' ? (moderationTherapist ?? moderationDefault) : role === 'PARENT' ? (moderationParent ?? moderationDefault) : moderationDefault)
  const profanityEnabled = (s['board.profanityFilter.enabled'] || 'false') === 'true'
  const blocklist = (s['board.profanityFilter.blocklist'] || '').split(',').map(w=>w.trim()).filter(Boolean)
  const filter = (t: string) => {
    if (!profanityEnabled || blocklist.length === 0) return t
    let res = t
    for (const w of blocklist) {
      try { res = res.replace(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'gi'), '***') } catch {}
    }
    return res
  }
  const imageUrl = parsed.data.imageUrl ? String(parsed.data.imageUrl) : undefined
  const publishAt = (json as any).publishAt ? new Date((json as any).publishAt) : null
  const fileUrl = (json as any).fileUrl ? String((json as any).fileUrl) : null
  const published = moderationRequired ? false : ((json as any).published === false ? false : (publishAt ? false : true))
  const p = await prisma.post.create({ data: {
    authorId: user.sub,
    title: sanitize(filter(parsed.data.title)),
    body: sanitize(filter(parsed.data.body)),
    imageUrl,
    fileUrl,
    pinned: Boolean(parsed.data.pinned ?? false),
    category: parsed.data.category ?? null,
    tags: parsed.data.tags && parsed.data.tags.length ? parsed.data.tags.join(',') : null,
    published,
    publishAt,
  } as any })
  return NextResponse.json(p, { status: 201 })
}
