"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export default function Header() {
  const router = useRouter()
  const onLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])
  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <nav className="mx-auto max-w-5xl flex items-center justify-between p-3">
        <div className="font-semibold">{/* Insert logo and school name here */}BuddyBoard</div>
        <div className="flex gap-4 text-sm items-center">
          <Link href="/">Home</Link>
          <Link href="/chat">Messages</Link>
          <Link href="/settings">Settings</Link>
          <button onClick={onLogout} className="rounded border px-3 py-1">Logout</button>
        </div>
      </nav>
    </header>
  )
}
