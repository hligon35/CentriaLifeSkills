import profilePng from '@/icons/profile.png'

// Returns a safe, Next.js-compatible avatar src:
// - Allows site-relative paths (e.g., /api/media/...) as-is
// - Allows only HTTPS remote URLs (blocks HTTP to avoid Next Image domain/protocol issues)
// - Falls back to a bundled placeholder image
export function safeAvatar(url?: string | null) {
  // Fallback first
  const fallback = (profilePng as any).src || profilePng
  if (!url) return fallback
  try {
    // Relative path → allow
    if (url.startsWith('/')) return url
    const u = new URL(url)
    if (u.protocol !== 'https:') return fallback
    return url
  } catch {
    return fallback
  }
}
