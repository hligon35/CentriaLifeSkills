const map = new Map<string, { v: any; exp: number }>()

export function setCache(key: string, value: any, ttlMs = 10_000) {
  map.set(key, { v: value, exp: Date.now() + ttlMs })
}

export function getCache<T = any>(key: string): T | null {
  const e = map.get(key)
  if (!e) return null
  if (Date.now() > e.exp) { map.delete(key); return null }
  return e.v as T
}

// For logging: integrate Sentry in app entrypoint if SENTRY_DSN is set.
