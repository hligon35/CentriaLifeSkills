"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function Header() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const onLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => setRole(j?.user?.role || null)).catch(() => setRole(null))
  }, [])
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
      <nav className="mx-auto max-w-5xl p-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{/* Insert logo and school name here */}BuddyBoard</div>
          {/* Desktop nav */}
          <div className="hidden sm:flex gap-4 text-sm items-center">
            <Link href="/">Home</Link>
            <Link href="/chat">Messages</Link>
            {role === 'PARENT' && <Link href="/parent/therapists">Therapists</Link>}
            {role === 'ADMIN' && <Link href="/admin/settings">Admin</Link>}
            <Link href="/settings">Settings</Link>
            <button onClick={onLogout} className="rounded border px-3 py-1">Logout</button>
          </div>
          {/* Mobile hamburger */}
          <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(v => !v)} className="sm:hidden rounded border px-3 py-1">
            Menu
          </button>
        </div>
        {/* Mobile panel */}
        {open && (
          <div className="sm:hidden mt-2 rounded border bg-white shadow divide-y">
            <div className="flex flex-col text-sm">
              <Link href="/" onClick={() => setOpen(false)} className="px-3 py-2">Home</Link>
              <Link href="/chat" onClick={() => setOpen(false)} className="px-3 py-2">Messages</Link>
              {role === 'PARENT' && <Link href="/parent/therapists" onClick={() => setOpen(false)} className="px-3 py-2">Therapists</Link>}
              {role === 'ADMIN' && <Link href="/admin/settings" onClick={() => setOpen(false)} className="px-3 py-2">Admin</Link>}
              <Link href="/settings" onClick={() => setOpen(false)} className="px-3 py-2">Settings</Link>
              <button onClick={() => { setOpen(false); onLogout() }} className="text-left px-3 py-2">Logout</button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
