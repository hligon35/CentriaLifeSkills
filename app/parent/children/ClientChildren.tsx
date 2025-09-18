// Legacy component retained temporarily for backward route access.
// This page's functionality has been consolidated into /parent/my-kid.
// We keep a lightweight client redirect to preserve deep links.
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientChildrenRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/parent/my-kid') }, [router])
  return (
    <div className="p-6 text-sm text-gray-600">This page has moved. Redirecting…</div>
  )
}
