import { ReactNode } from 'react'
import PathNavTabs from '@/components/PathNavTabs'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function ParentSectionLayout({ children }: { children: ReactNode }) {
  const me = await getSession()
  if (!me || me.role !== 'PARENT') redirect('/login')
  const tabs = [
  { href: '/parent', label: 'Home' },
  { href: '/parent/messages', label: 'Messages' },
  { href: '/parent/my-kid', label: 'My Kid' },
  { href: '/parent/settings', label: 'Settings' },
  ]
  return (
    <section className="mx-auto max-w-5xl p-4 md:pt-0">
      {/* Offset below fixed desktop header (h-16) and remove top padding on md+ */}
      <PathNavTabs items={tabs} className="md:top-16" />
      {children}
    </section>
  )
}
