"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type TabItem = {
  href: string
  label: string
  activePaths?: string[]
}

export default function PathNavTabs({ items, className }: { items: TabItem[]; className?: string }) {
  const pathname = usePathname() || '/'
  return (
    <div className={`mb-12 md:mb-14 sticky top-0 z-30 bg-gray-50 ${className || ''}`}>
      <div role="tablist" aria-label="Section navigation" data-tour="tabs" className="flex flex-wrap justify-center gap-2 border-b">
        {items.map((item) => {
          // Active logic:
          // 1. If explicit activePaths provided, use them (exact or descendant match)
          // 2. Else treat tab as active only on exact path (avoid Home staying active everywhere)
          const normalized = (p:string) => p.endsWith('/') ? p.slice(0,-1) : p
          const current = normalized(pathname)
          const itemHref = normalized(item.href)
          const activeByExtra = (item.activePaths || []).some(p => {
            const base = normalized(p)
            return current === base || current.startsWith(base + '/')
          })
          let isActive: boolean
            
          if (item.activePaths && item.activePaths.length > 0) {
            isActive = activeByExtra || current === itemHref || current.startsWith(itemHref + '/')
          } else {
            // Exact only when no activePaths provided
            isActive = current === itemHref
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              className={`px-3 py-2 text-sm -mb-[1px] border-b-2 ${isActive ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
