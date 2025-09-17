"use client"
import Link from 'next/link'
import Image, { type StaticImageData } from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { APP_TITLE } from '@/lib/appConfig'
import clsx from 'clsx'
import homePng from '@/icons/home.png'
import messagesPng from '@/icons/messages.png'
import calendarPng from '@/icons/calendar.png'
import profilePng from '@/icons/profile.png'
import settingsPng from '@/icons/settings.png'
import logoutPng from '@/icons/logout.png'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [unread, setUnread] = useState<number>(0)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const onLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => setRole(j?.user?.role || null)).catch(() => setRole(null))
    fetch('/api/messages/unread').then(r => r.json()).then(j => setUnread(Number(j?.counts?.direct || 0))).catch(() => setUnread(0))
  }, [])
  // Close desktop menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const desktopItems = useMemo(() => {
    if (role === 'PARENT') {
      return [
        { href: '/', label: 'Home' },
        { href: '/chat', label: 'Messages' },
        { href: '/calendar', label: 'Calendar' },
        { href: '/parent/therapists', label: 'Therapists' },
      ]
    }
    if (role === 'ADMIN') {
      return [
        { href: '/', label: 'Home' },
        { href: '/admin?tab=messages', label: 'Messages' },
        { href: '/admin?tab=calendar', label: 'Calendar' },
        { href: '/admin?tab=directory', label: 'Directory' },
        { href: '/admin?tab=settings', label: 'Admin' },
      ]
    }
    return [
      { href: '/', label: 'Home' },
      { href: '/chat', label: 'Messages' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/settings', label: 'Settings' },
    ]
  }, [role])

  const menuRef = useRef<HTMLDivElement | null>(null)
  // When menu opens, focus first item and add Escape + focus trap
  useEffect(() => {
    if (!menuOpen) return
    const root = menuRef.current
    const focusables = root?.querySelectorAll<HTMLElement>('a,button') || []
    focusables[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setMenuOpen(false) }
      if (e.key === 'Tab' && focusables.length > 0) {
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && focusables.length > 0) {
        e.preventDefault()
        const idx = Array.from(focusables).indexOf(document.activeElement as HTMLElement)
        const next = e.key === 'ArrowDown' ? (idx + 1) % focusables.length : (idx - 1 + focusables.length) % focusables.length
        focusables[next]?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      <DesktopTopBar
        title={APP_TITLE}
        onToggle={() => setMenuOpen(v => !v)}
        open={menuOpen}
      />
      {/* Desktop menu with backdrop */}
      {menuOpen && (
        <>
          <div aria-hidden="true" role="presentation" className="hidden md:block fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div ref={menuRef} className="hidden md:block fixed top-14 right-2 z-50 w-56 rounded-md border bg-white text-gray-800 shadow-lg p-2" aria-label="Main menu">
            <ul className="text-sm">
              {desktopItems.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="block rounded px-2 py-2 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>{item.label}</Link>
                </li>
              ))}
              <li className="border-t my-1" />
              <li>
                <button onClick={() => { setMenuOpen(false); onLogout() }} className="w-full text-left rounded px-2 py-2 hover:bg-gray-100 text-red-600">Log out</button>
              </li>
            </ul>
          </div>
        </>
      )}
      <MobileBottomNav role={role} activePath={pathname || '/'} onLogout={onLogout} unread={unread} />
    </>
  )
}

function MobileBottomNav({ role, activePath, onLogout, unread }: { role: string | null; activePath: string; onLogout: () => void; unread: number }) {
  // Choose 4 nav items based on role
  const items = useMemo((): Array<{ href: string; label: string; icon: JSX.Element; match: (p: string) => boolean }> => {
    if (role === 'PARENT') {
      return [
        { href: '/', label: 'Home', icon: PngIcon(homePng), match: p => p === '/' },
        { href: '/chat', label: 'Messages', icon: PngIcon(messagesPng, unread), match: p => p.startsWith('/chat') },
        { href: '/calendar', label: 'Calendar', icon: PngIcon(calendarPng), match: p => p.startsWith('/calendar') },
        { href: '/parent/therapists', label: 'Therapists', icon: PngIcon(profilePng), match: p => p.startsWith('/parent/therapists') },
      ]
    }
  if (role === 'ADMIN') {
      return [
        { href: '/', label: 'Home', icon: PngIcon(homePng), match: p => p === '/' },
        { href: '/admin?tab=messages', label: 'Messages', icon: PngIcon(messagesPng, unread), match: p => p.startsWith('/admin') },
        { href: '/admin?tab=calendar', label: 'Calendar', icon: PngIcon(calendarPng), match: p => p.startsWith('/admin') },
        { href: '/admin?tab=directory', label: 'Directory', icon: PngIcon(profilePng), match: p => p.startsWith('/admin') },
        { href: '/admin?tab=settings', label: 'Admin', icon: PngIcon(settingsPng), match: p => p.startsWith('/admin') },
      ]
    }
    // Default (therapist)
    return [
      { href: '/', label: 'Home', icon: PngIcon(homePng), match: p => p === '/' },
      { href: '/chat', label: 'Messages', icon: PngIcon(messagesPng, unread), match: p => p.startsWith('/chat') },
      { href: '/calendar', label: 'Calendar', icon: PngIcon(calendarPng), match: p => p.startsWith('/calendar') },
      { href: '/settings', label: 'Settings', icon: PngIcon(settingsPng), match: p => p.startsWith('/settings') },
    ]
  }, [role, unread])

  return (
  <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#623394] text-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="w-full grid grid-cols-[repeat(4,1fr)_auto] items-center px-2 -ml-[10px]">
        <ul className="col-span-4 w-full grid grid-cols-4">
          {items.map((it) => {
            const active = it.match(activePath)
            return (
              <li key={it.href} className="list-none">
                <Link aria-label={it.label} href={it.href} className={clsx('flex items-center justify-center py-3 w-full h-full', active ? 'opacity-100' : 'opacity-80') }>
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
          className="justify-self-end p-2 rounded-md hover:bg-white/15 focus:outline-none focus-visible:ring translate-y-[3px]"
        >
          {PngIcon(logoutPng)}
        </button>
      </div>
    </nav>
  )
}

function PngIcon(src: string | StaticImageData, unread?: number) {
  return (
    <span className="relative inline-flex">
      <Image src={src} alt="" aria-hidden width={24} height={24} className="h-6 w-6" />
      {(unread || 0) > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] leading-none px-1.5 py-0.5 min-w-[1rem]">{Math.min(unread || 0, 99)}</span>
      )}
    </span>
  )
}

function DesktopTopBar({ title, onToggle, open }: { title: string; onToggle: () => void; open: boolean }) {
  return (
    <header className="hidden md:flex fixed top-0 inset-x-0 z-40 h-14 bg-[#623394] text-white items-center justify-center relative">
      {/* Centered logo + title */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 select-none">
        <span aria-hidden className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#623394] font-bold text-sm">CL</span>
        <span className="font-semibold tracking-wide">{title}</span>
      </div>
      {/* Right menu toggle */}
      <button
        type="button"
        aria-label="Toggle menu"
        onClick={onToggle}
        className="absolute right-2 p-2 rounded-md hover:bg-white/15 focus:outline-none focus-visible:ring"
        title="Menu"
      >
        {IconMenu()}
      </button>
    </header>
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
function IconChat(unread?: number) {
  return (
    <span className="relative inline-flex">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M1.5 6.75A3.75 3.75 0 0 1 5.25 3h13.5A3.75 3.75 0 0 1 22.5 6.75v6a3.75 3.75 0 0 1-3.75 3.75H9l-4.94 3.296A.75.75 0 0 1 3 19.176V16.5h2.25A3.75 3.75 0 0 1 9 12.75h9.75v-6A2.25 2.25 0 0 0 16.5 4.5H5.25A2.25 2.25 0 0 0 3 6.75v2.25H1.5v-2.25Z"/>
      </svg>
      {(unread || 0) > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] leading-none px-1.5 py-0.5 min-w-[1rem]">{Math.min(unread || 0, 99)}</span>
      )}
    </span>
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

function IconMenu() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M3.75 6.75a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75ZM3.75 12a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15A.75.75 0 0 1 3.75 12Zm0 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Z"/>
    </svg>
  )
}
