import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
	return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store, max-age=0',
		},
	})
}

export async function HEAD(_req: NextRequest) {
	return new Response(null, {
		status: 200,
		headers: { 'Cache-Control': 'no-store, max-age=0' },
	})
}
