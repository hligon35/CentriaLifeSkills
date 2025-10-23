"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { TourStep } from '../../lib/tour'

export default function TourOverlay({ step, index, count, onNext, onPrev, onClose }: {
  step: TourStep
  index: number
  count: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}) {
  // Prevent background scroll while tour is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const Demo = step.demo

  // Spotlight target logic
  const [rect, setRect] = useState<{top:number;left:number;width:number;height:number} | null>(null)
  const targetElRef = useRef<HTMLElement | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const pad = (step.highlightPadding ?? 8)
  useEffect(() => {
    const sel = step.target
    // Cleanup previous observer
    roRef.current?.disconnect(); roRef.current = null
    targetElRef.current = null
    if (!sel) { setRect(null); return }
    const el = document.querySelector(sel) as HTMLElement | null
    if (!el) { setRect(null); return }
    targetElRef.current = el
    // Scroll into view and compute rect
    try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }) } catch {}
    const compute = () => {
      const r = el.getBoundingClientRect()
      setRect({ top: Math.max(0, r.top - pad), left: Math.max(0, r.left - pad), width: r.width + pad*2, height: r.height + pad*2 })
    }
    compute()
    // Observe size changes
    try {
      const ro = new ResizeObserver(() => compute())
      ro.observe(el)
      roRef.current = ro
    } catch {}
    // Listen to resize/scroll
    const onResize = () => compute()
    const onScroll = () => compute()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      roRef.current?.disconnect(); roRef.current = null
    }
  }, [step, pad])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') {
        if (index === count - 1) onClose(); else onNext()
      }
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNext, onPrev, onClose, index, count])

  // Accessibility: focus trap
  const panelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const focusable = panel.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (focusable.length === 0) return
      if (e.shiftKey) {
        if (document.activeElement === first) { (last || first).focus(); e.preventDefault() }
      } else {
        if (document.activeElement === last) { (first || last).focus(); e.preventDefault() }
      }
    }
    first?.focus()
    panel.addEventListener('keydown', onKeyDown)
    return () => panel.removeEventListener('keydown', onKeyDown)
  }, [])

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-desc">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Spotlight highlight */}
      {rect && (
        <div
          className={`absolute pointer-events-none rounded-lg ring-4 ring-[#623394]/70 ${prefersReducedMotion ? '' : 'animate-pulse'} shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]`}
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}

      {/* Panel */}
      <div ref={panelRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[96vw] sm:w-[min(90vw,900px)] max-h-[90vh] overflow-auto rounded-lg bg-white shadow-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-500">Step {index + 1} of {count}</div>
          <button className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100" onClick={onClose} aria-label="Close tour">✕</button>
        </div>
        <div className="p-4 grid md:grid-cols-2 gap-4 items-center">
          <div>
            <h2 id="tour-title" className="text-lg font-semibold mb-2">{step.title}</h2>
            <p id="tour-desc" className="text-sm text-gray-700 whitespace-pre-line">{step.description}</p>
            {step.hint && (<p className="mt-2 text-xs text-gray-500">Tip: {step.hint}</p>)}
          </div>
          <div className="border rounded-md p-3 bg-gray-50">
            {Demo ? <Demo /> : <div className="text-sm text-gray-500">No demo available for this step.</div>}
          </div>
        </div>
        <div className="p-4 border-t flex flex-col sm:flex-row gap-3 sm:gap-2 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              className="flex-1 sm:flex-none rounded border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={onPrev}
              disabled={index === 0}
            >Back</button>
            {index < count - 1 ? (
              <button
                className="flex-1 sm:flex-none rounded border px-3 py-2 text-sm hover:bg-gray-50"
                onClick={onNext}
              >Next</button>
            ) : (
              <button
                className="flex-1 sm:flex-none rounded bg-brand-600 text-white px-3 py-2 text-sm hover:opacity-90"
                onClick={onClose}
              >Done</button>
            )}
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" onChange={async (e) => {
              try {
                const role = step.role
                if (!role) return
                const key = `tour:skip:${role}`
                if (e.target.checked) localStorage.setItem(key, '1')
                else localStorage.removeItem(key)
                await fetch(`/api/tour/skip?role=${role}`, { method: e.target.checked ? 'POST' : 'DELETE' })
              } catch {}
            }} />
            Don't show again for my role
          </label>
        </div>
      </div>
    </div>
  )
}
