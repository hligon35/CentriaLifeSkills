import { useEffect, useState } from 'react'

/**
 * Lightweight client hook to retrieve consolidated session context once.
 * Caches the result in-module to avoid duplicate network requests.
 */
export interface SessionContext {
  user?: { sub: string; role: string; name?: string | null; email?: string | null } | null
  settings: Record<string, any>
  loading: boolean
  error?: string | null
}

let cached: Omit<SessionContext, 'loading'> | null = null
let inflight: Promise<any> | null = null

export function useSessionContext(): SessionContext {
  const [state, setState] = useState<SessionContext>(() => ({ user: cached?.user, settings: cached?.settings || {}, loading: !cached }))

  useEffect(() => {
    if (cached) return
    if (!inflight) {
      inflight = fetch('/api/session/context')
        .then(r => r.json())
        .then(d => { cached = { user: d.user ?? null, settings: d.settings || {} }; return cached })
        .catch(() => { cached = { user: null, settings: {}, error: 'Failed to load session context' } })
        .finally(() => { inflight = null })
    }
    inflight.then(() => {
      setState(s => ({ ...s, user: cached?.user ?? null, settings: cached?.settings || {}, loading: false, error: (cached as any)?.error }))
    })
  }, [])

  return state
}

export function __resetSessionContextCache() { cached = null; inflight = null }
