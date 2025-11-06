"use client"
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { APP_TITLE } from '@/lib/appConfig'
import Link from 'next/link'
import Image from 'next/image'
import { useTour } from './tour/TourProvider'

export default function Header() {
  const pathname = usePathname()
  // Mobile nav removed; no role-dependent UI remains

  return (
    <>
      <DesktopTopBar title={APP_TITLE} />
      {/* Mobile bottom nav removed globally */}
    </>
  )
}

function DesktopTopBar({ title }: { title: string }) {
  const pathname = usePathname()
  const [displayName, setDisplayName] = useState<string | null>(null)
  const tour = useTour()

  useEffect(() => {
    let alive = true
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (!alive || !j?.user) { if (alive) setDisplayName(null); return }
        const name: string | undefined = j.user.name
        const role: string | undefined = j.user.role
        const first = name?.trim().split(/\s+/)[0]
        const byRole = role === 'ADMIN' ? 'Admin' : role === 'THERAPIST' ? 'Therapist' : role === 'PARENT' ? 'Parent' : undefined
        setDisplayName(first || byRole || null)
      })
      .catch(() => { if (alive) setDisplayName(null) })
    return () => { alive = false }
  }, [])

  const baseGreeting = `Welcome to ${title}`
  const greeting = displayName ? `${baseGreeting}, ${displayName}` : baseGreeting

  return (
    <header className="hidden md:flex fixed top-0 inset-x-0 z-40 h-16 bg-[#623394] text-white items-center">
      {/* Center: logo next to greeting */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 text-center">
        <Link href="/" aria-label="Go to home" className="select-none hover:opacity-95 active:opacity-90">
          <Image src="/api/assets/buddyBoard" alt="BuddyBoard" width={256} height={64} className="h-16 max-h-full w-auto object-contain" priority />
        </Link>
        <span className="font-medium text-sm sm:text-base">{greeting}</span>
      </div>

      {/* Right-side actions */}
      {!pathname?.startsWith('/login') && (
        <div className="absolute right-3 flex items-center gap-2">
          <button
            onClick={() => {
              // Infer role for tailored tour (force start, bypass skip flag)
              fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(j => {
                const role = (j?.user?.role || 'PARENT') as 'ADMIN'|'THERAPIST'|'PARENT'
                tour.start(role, { force: true })
              }).catch(() => tour.start('PARENT', { force: true }))
            }}
            className="inline-flex items-center gap-1 rounded border border-white/20 bg-white/10 hover:bg-white/20 px-2 py-1 text-sm"
          >
            Start tour
          </button>
          <LogoutButton />
        </div>
      )}
    </header>
  )
}

function LogoutButton() {
  async function doLogout() {
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch {}
    // Always bounce to login
    if (typeof window !== 'undefined') window.location.href = '/login'
  }
  return (
    <button
      onClick={doLogout}
      className="inline-flex items-center gap-1 rounded border border-white/20 bg-white/10 hover:bg-white/20 px-2 py-1 text-sm"
      title="Log out"
      aria-label="Log out"
    >
      <IconPower />
      <span className="hidden sm:inline">Logout</span>
    </button>
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

function IconMenu() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M3.75 6.75a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75ZM3.75 12a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15A.75.75 0 0 1 3.75 12Zm0 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Z"/>
    </svg>
  )
}
