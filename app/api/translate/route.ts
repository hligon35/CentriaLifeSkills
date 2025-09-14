import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// Demo translation endpoint (stub). In production, integrate with Azure Translator or Google Cloud Translate.
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { text, target } = await req.json().catch(() => ({ text: '', target: 'en' }))
  if (typeof text !== 'string' || !text) return NextResponse.json({ error: 'Invalid text' }, { status: 400 })
  const to = typeof target === 'string' && target ? target : 'en'
  // Simple demo: pretend translation by appending [to]
  const translated = `${text} [${to}]`
  return NextResponse.json({ translated, target: to })
}
