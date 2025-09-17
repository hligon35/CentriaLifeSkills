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
    <div className={`mb-3 sticky top-0 z-30 bg-gray-50 ${className || ''}`}>
      <div role="tablist" aria-label="Section navigation" className="flex flex-wrap justify-center gap-2 border-b">
        {items.map((item) => {
          const activeByExtra = (item.activePaths || []).some(p => pathname === p || pathname.startsWith(p.endsWith('/') ? p : p + '/'))
          const isActive = activeByExtra || pathname === item.href || pathname.startsWith(item.href.endsWith('/') ? item.href : item.href + '/')
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
