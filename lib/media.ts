export function safeAvatar(url?: string | null) {
  if (!url) return '/icons/profile.png'
  try {
    const u = new URL(url, 'http://localhost')
    if (!u.protocol.startsWith('http')) return '/icons/profile.png'
    return url
  } catch {
    return '/icons/profile.png'
  }
}
