import { MetadataRoute } from 'next'

// Basic sitemap excluding protected/auth-only routes.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://example.com'
  const now = new Date().toISOString()
  const publicPaths = [
    '/',
    '/login',
    '/search',
    '/calendar',
    '/appointments',
    '/notifications'
  ]
  return publicPaths.map(p => ({ url: base + p, lastModified: now, changeFrequency: 'daily' as const, priority: p === '/' ? 1 : 0.5 }))
}
