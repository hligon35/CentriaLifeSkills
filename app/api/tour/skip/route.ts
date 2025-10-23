import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') || ''
  const cookieName = role ? `tour_skip_${role}` : 'tour_skip'
  const cookie = req.cookies.get(cookieName)
  return new Response(JSON.stringify({ skip: cookie?.value === '1' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') || ''
  const cookieName = role ? `tour_skip_${role}` : 'tour_skip'
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append('Set-Cookie', `${cookieName}=1; Path=/; Max-Age=${60*60*24*365}; SameSite=Lax`)
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') || ''
  const cookieName = role ? `tour_skip_${role}` : 'tour_skip'
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append('Set-Cookie', `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`)
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
}
