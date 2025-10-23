import { NextRequest } from 'next/server'

// Minimal endpoint for external cron/uptime pingers to hit regularly.
// Optionally protect with KEEPALIVE_TOKEN: require ?token=... or header X-Keepalive-Token when set.
// Returns 204 with no body and no caching.
function authorized(req: NextRequest) {
  const token = process.env.KEEPALIVE_TOKEN
  if (!token) return true
  const qp = new URL(req.url).searchParams.get('token')
  const hdr = req.headers.get('x-keepalive-token')
  return qp === token || hdr === token
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 })
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store, max-age=0' } })
}

export async function HEAD(req: NextRequest) {
  if (!authorized(req)) return new Response(null, { status: 401 })
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
