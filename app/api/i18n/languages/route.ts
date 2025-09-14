import { NextResponse } from 'next/server'

export async function GET() {
  // Minimal supported languages list for UI selection
  return NextResponse.json({ languages: [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'ar', name: 'العربية' },
    { code: 'zh', name: '中文' },
    { code: 'vi', name: 'Tiếng Việt' },
  ] })
}
