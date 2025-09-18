import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://example.com'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/parent/', '/therapist/', '/admin/'] }
    ],
    sitemap: base + '/sitemap.xml'
  }
}
