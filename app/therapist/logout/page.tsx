"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TherapistLogoutPage() {
  const router = useRouter()
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await fetch('/api/logout', { method: 'POST' })
      } catch {}
      if (!cancelled) router.replace('/login')
    })()
    return () => { cancelled = true }
  }, [router])
  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <div className="text-sm text-gray-600">Signing you out…</div>
    </main>
  )
}
