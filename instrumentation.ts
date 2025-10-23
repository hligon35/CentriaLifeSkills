// Runs when the Next.js server starts (Node runtime). Use to schedule small background tasks.
// We use it to ping the app's own health endpoint periodically so Render doesn't suspend it.

export async function register() {
  try {
    // Avoid duplicates during reloads
    const g: any = globalThis as any
    if (g.__keepAliveStarted) return

    const enabled = process.env.KEEPALIVE === '1'
    const isProd = process.env.NODE_ENV === 'production'
    if (!enabled || !isProd) return

    // Prefer explicit KEEPALIVE_PING_URL, else Render's provided external URL
    const base = (process.env.KEEPALIVE_PING_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '')
    if (!base) return

    // Multiple candidates in case one path is blocked; we'll try in order
    const candidates = [
      `${base}/api/health`,
      `${base}/api/keepalive`,
      base,
    ]
    const intervalMs = Math.max(60000, Number(process.env.KEEPALIVE_INTERVAL_MS || 180_000)) // default 3 minutes

    const jitter = Math.floor(Math.random() * 10_000)
    const start = Date.now() + jitter

    async function ping() {
      try {
        // Try HEAD first where reasonable
        const [url1, url2, url3] = candidates
        let ok = false
        try {
          const r1 = await fetch(url1, { method: 'HEAD', cache: 'no-store' })
          ok = r1.ok
        } catch {}
        if (!ok) {
          try {
            const r2 = await fetch(url2, { method: 'HEAD', cache: 'no-store' })
            ok = r2.ok
          } catch {}
        }
        if (!ok) {
          try {
            const r3 = await fetch(url3, { method: 'HEAD', cache: 'no-store' })
            ok = r3.ok
          } catch {}
        }
        // As final fallback, GET health
        if (!ok) {
          try { await fetch(url1, { cache: 'no-store' }) } catch {}
        }
      } catch {
        // ignore network errors
      }
    }

    // Initial delayed ping to add slight jitter among instances
    setTimeout(() => {
      ping()
      const timer = setInterval(ping, intervalMs)
      // Store to prevent GC and mark started
      g.__keepAliveTimer = timer
      g.__keepAliveStarted = true
    }, Math.max(0, start - Date.now()))
  } catch {
    // no-op
  }
}
