"use client"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const onLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => setRole(j?.user?.role || null)).catch(() => setRole(null))
  }, [])
  return <MobileBottomNav role={role} activePath={pathname || '/'} onLogout={onLogout} />
}

function MobileBottomNav({ role, activePath, onLogout }: { role: string | null; activePath: string; onLogout: () => void }) {
  // Choose 4 nav items based on role
  const items = useMemo((): Array<{ href: string; label: string; icon: JSX.Element; match: (p: string) => boolean }> => {
    if (role === 'PARENT') {
      return [
        { href: '/', label: 'Home', icon: IconHome(), match: p => p === '/' },
        { href: '/chat', label: 'Messages', icon: IconChat(), match: p => p.startsWith('/chat') },
        { href: '/calendar', label: 'Calendar', icon: IconBell(), match: p => p.startsWith('/calendar') },
        { href: '/parent/therapists', label: 'Therapists', icon: IconUsers(), match: p => p.startsWith('/parent/therapists') },
      ]
    }
  if (role === 'ADMIN') {
      return [
        { href: '/', label: 'Home', icon: IconHome(), match: p => p === '/' },
        { href: '/calendar', label: 'Calendar', icon: IconBell(), match: p => p.startsWith('/calendar') },
        { href: '/admin/directory', label: 'Directory', icon: IconUsers(), match: p => p.startsWith('/admin/directory') },
        { href: '/admin/settings', label: 'Admin', icon: IconShield(), match: p => p.startsWith('/admin/settings') },
      ]
    }
    // Default (therapist)
    return [
      { href: '/', label: 'Home', icon: IconHome(), match: p => p === '/' },
      { href: '/chat', label: 'Messages', icon: IconChat(), match: p => p.startsWith('/chat') },
      { href: '/calendar', label: 'Calendar', icon: IconBell(), match: p => p.startsWith('/calendar') },
      { href: '/search', label: 'Search', icon: IconCog(), match: p => p.startsWith('/search') },
    ]
  }, [role])

  return (
  <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#623394] text-white pb-[env(safe-area-inset-bottom)] relative">
  <ul className="grid grid-cols-4 pr-12">
        {items.map((it) => {
          const active = it.match(activePath)
          return (
            <li key={it.href} className="list-none">
              <Link aria-label={it.label} href={it.href} className={clsx('flex items-center justify-center py-3', active ? 'opacity-100' : 'opacity-80') }>
                <span aria-hidden className={clsx('h-8 w-8 rounded-md flex items-center justify-center', active ? 'bg-white/15' : 'bg-transparent')}>{it.icon}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        aria-label="Log out"
        title="Log out"
        onClick={onLogout}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-white/15 focus:outline-none focus-visible:ring"
      >
        {IconPower()}
      </button>
    </nav>
  )
}

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8 8a.75.75 0 1 1-1.06 1.06L12 5.56 4.53 12.9a.75.75 0 1 1-1.06-1.06l8-8Z"/>
      <path d="M5.25 10.5a.75.75 0 0 1 .75-.75h.75v8.25h10.5V9.75h.75a.75.75 0 0 1 .75.75v8.25A2.25 2.25 0 0 1 16.5 21H7.5A2.25 2.25 0 0 1 5.25 18.75V10.5Z"/>
    </svg>
  )
}
function IconChat() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M1.5 6.75A3.75 3.75 0 0 1 5.25 3h13.5A3.75 3.75 0 0 1 22.5 6.75v6a3.75 3.75 0 0 1-3.75 3.75H9l-4.94 3.296A.75.75 0 0 1 3 19.176V16.5h2.25A3.75 3.75 0 0 1 9 12.75h9.75v-6A2.25 2.25 0 0 0 16.5 4.5H5.25A2.25 2.25 0 0 0 3 6.75v2.25H1.5v-2.25Z"/>
    </svg>
  )
}
function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
      <path d="M2.25 19.5a7.5 7.5 0 1 1 15 0v.75H2.25V19.5Z"/>
    </svg>
  )
}
function IconCog() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M10.325 2.827a1.5 1.5 0 0 1 3.35 0l.106.847a7.5 7.5 0 0 1 1.71.707l.778-.428a1.5 1.5 0 1 1 1.5 2.598l-.676.372c.265.52.47 1.074.608 1.654h.752a1.5 1.5 0 0 1 0 3h-.752a8.96 8.96 0 0 1-.608 1.654l.676.372a1.5 1.5 0 1 1-1.5 2.598l-.778-.428a7.5 7.5 0 0 1-1.71.707l-.106.847a1.5 1.5 0 0 1-3.35 0l-.106-.847a7.5 7.5 0 0 1-1.71-.707l-.778.428a1.5 1.5 0 1 1-1.5-2.598l.676-.372A8.96 8.96 0 0 1 6.45 12.9H5.7a1.5 1.5 0 0 1 0-3h.752a8.96 8.96 0 0 1 .608-1.654l-.676-.372a1.5 1.5 0 1 1 1.5-2.598l.778.428c.54-.313 1.116-.556 1.71-.707l.106-.847ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>
    </svg>
  )
}
function IconShield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 2.25 3.75 6v6c0 5.385 3.402 8.632 7.518 9.66a1.5 1.5 0 0 0 .464 0C16.848 20.632 20.25 17.385 20.25 12V6L12 2.25Z"/>
    </svg>
  )
}
function IconBell() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M12 2.25a6.75 6.75 0 0 0-6.75 6.75v3.09l-1.31 2.62A1.5 1.5 0 0 0 5.25 16.5h13.5a1.5 1.5 0 0 0 1.31-2.28l-1.31-2.62V9A6.75 6.75 0 0 0 12 2.25Z"/>
      <path d="M9.75 18.75a2.25 2.25 0 1 0 4.5 0h-4.5Z"/>
    </svg>
  )
}

function IconPower() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M11.25 3.75a.75.75 0 0 1 1.5 0v7.5a.75.75 0 0 1-1.5 0v-7.5Z" />
      <path d="M5.636 5.636a8.25 8.25 0 1 0 12.728 0 .75.75 0 1 0-1.06 1.061 6.75 6.75 0 1 1-10.607 0 .75.75 0 0 0-1.06-1.06Z" />
    </svg>
  )
}
