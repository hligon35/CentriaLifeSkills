import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: Request) {
  // Redirect /favicon.ico to the app icon so browsers stop 404'ing this path
  const url = new URL('/icon.png', request.url)
  return NextResponse.redirect(url, { status: 308 })
}
