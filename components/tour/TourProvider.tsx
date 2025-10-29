"use client"
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { TourStep, Role } from '../../lib/tour'
import { getRoleSteps } from '../../lib/tour'
import dynamic from 'next/dynamic'
const TourOverlay = dynamic(() => import('./TourOverlay'), { ssr: false })

export type TourState = {
  active: boolean
  steps: TourStep[]
  index: number
  start: (role: Role, opts?: { force?: boolean }) => void
  stop: () => void
  next: () => void
  prev: () => void
}

const TourCtx = createContext<TourState | null>(null)

export default function TourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false)
  const [steps, setSteps] = useState<TourStep[]>([])
  const [index, setIndex] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const pendingNav = useRef<string | null>(null)

  // Resume across route changes: when path changes and a step has navigateTo equal to path, clear pending
  useEffect(() => {
    if (!active) return
    if (pendingNav.current && pathname?.startsWith(pendingNav.current)) {
      pendingNav.current = null
    }
  }, [pathname, active, start])

  

  const start = useCallback((role: Role, opts?: { force?: boolean }) => {
    const key = `tour:skip:${role}`
    if (!opts?.force && typeof window !== 'undefined' && localStorage.getItem(key) === '1') {
      return
    }
    const s = getRoleSteps(role)
    setSteps(s)
    setIndex(0)
    setActive(true)
    if (s[0]?.navigateTo && !pathname?.startsWith(s[0].navigateTo)) {
      pendingNav.current = s[0].navigateTo
      router.push(s[0].navigateTo)
    }
  }, [pathname, router])

  // Auto-start tour once per role on first eligible page visit (not on login/register)
  useEffect(() => {
    if (active) return
    const path = pathname || ''
    if (!path || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/api')) return
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/auth/me')
        if (!r.ok) return
        const j = await r.json().catch(() => null)
        const role = j?.user?.role as Role | undefined
        if (!role) return
        const skipKey = `tour:skip:${role}`
        if (localStorage.getItem(skipKey) === '1') return
        // Also check server-side cookie flag
        try {
          const s = await fetch(`/api/tour/skip?role=${role}`)
          const sj = await s.json().catch(()=>null)
          if (sj?.skip) return
        } catch {}
        const autoKey = `tour:auto:${role}`
        if (localStorage.getItem(autoKey) === '1') return
        if (cancelled) return
        localStorage.setItem(autoKey, '1')
        start(role)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [pathname, active, start])

  const stop = useCallback(() => {
    setActive(false)
    setSteps([])
    setIndex(0)
  }, [])
  const next = useCallback(() => {
    setIndex(i => {
      const ni = Math.min(steps.length - 1, i + 1)
      if (steps[ni]?.navigateTo && !pathname?.startsWith(steps[ni].navigateTo)) {
        pendingNav.current = steps[ni].navigateTo!
        router.push(steps[ni].navigateTo!)
      }
      return ni
    })
  }, [pathname, router, steps])
  const prev = useCallback(() => {
    setIndex(i => Math.max(0, i - 1))
  }, [])

  const value = useMemo(() => ({ active, steps, index, start, stop, next, prev }), [active, steps, index, start, stop, next, prev])

  return (
    <TourCtx.Provider value={value}>
      {children}
      {active && steps[index] && (
        <TourOverlay step={steps[index]} index={index} count={steps.length} onNext={next} onPrev={prev} onClose={stop} /> 
      )}
    </TourCtx.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourCtx)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}
