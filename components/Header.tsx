"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function Header() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const onLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => setRole(j?.user?.role || null)).catch(() => setRole(null))
  }, [])
  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <nav className="mx-auto max-w-5xl flex items-center justify-between p-3">
        <div className="font-semibold">{/* Insert logo and school name here */}BuddyBoard</div>
        <div className="flex gap-4 text-sm items-center">
          <Link href="/">Home</Link>
          <Link href="/chat">Messages</Link>
          {role === 'PARENT' && <Link href="/parent/therapists">Therapists</Link>}
          <Link href="/settings">Settings</Link>
          <button onClick={onLogout} className="rounded border px-3 py-1">Logout</button>
        </div>
      </nav>
    </header>
  )
}
