export interface ApiError extends Error { status?: number; info?: any }

type ApiOptions = RequestInit & { json?: any; query?: Record<string,string|number|boolean|undefined|null> }

function buildUrl(path: string, query?: ApiOptions['query']) {
  if (!query || Object.keys(query).length === 0) return path
  const u = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  for (const [k,v] of Object.entries(query)) {
    if (v === undefined || v === null) continue
    u.searchParams.set(k, String(v))
  }
  return u.pathname + u.search
}

export async function api<T=any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { json, query, headers, ...rest } = opts
  const url = buildUrl(path, query)
  const finalHeaders: HeadersInit = {
    'Accept': 'application/json',
    ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(headers||{})
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)
  try {
    const res = await fetch(url, { ...rest, headers: finalHeaders, body: json !== undefined ? JSON.stringify(json) : rest.body, signal: controller.signal })
    const ct = res.headers.get('content-type') || ''
    const body = ct.includes('application/json') ? await res.json().catch(()=>null) : await res.text().catch(()=>null)
    if (!res.ok) {
      const err: ApiError = new Error(body?.error || body?.message || `Request failed: ${res.status}`)
      err.status = res.status
      err.info = body
      throw err
    }
    return body as T
  } finally {
    clearTimeout(timeout)
  }
}

export function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === 'object' && 'message' in e
}
