import { ReactNode } from 'react'
import PathNavTabs from '@/components/PathNavTabs'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await getSession()
  if (!me || me.role !== 'ADMIN') redirect('/login')
  const tabs = [
    { href: '/admin', label: 'Home' },
    { href: '/admin/messages', label: 'Messages' },
    { href: '/admin/calendar', label: 'Calendar' },
    { href: '/admin/directory', label: 'Directory' },
    { href: '/admin/moderation', label: 'Moderation' },
    { href: '/admin/settings', label: 'Settings' },
  ]
  return (
    <section className="mx-auto max-w-6xl p-4 md:pt-0">
      {/* Offset sticky tabs below fixed desktop header (h-16) and remove top padding on md+ so it touches header */}
      <PathNavTabs items={tabs} className="md:top-16" />
      {children}
    </section>
  )
}