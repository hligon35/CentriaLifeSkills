import { ReactNode } from 'react'
import PathNavTabs from '@/components/PathNavTabs'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function ParentSectionLayout({ children }: { children: ReactNode }) {
  const me = await getSession()
  if (!me || me.role !== 'PARENT') redirect('/login')
  const tabs = [
    { href: '/', label: 'Home', activePaths: ['/', '/board'] },
    { href: '/chat', label: 'Messages' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/parent/therapists', label: 'Therapists' },
    { href: '/parent', label: 'Dashboard' },
    { href: '/parent/children', label: 'My Children' },
  ]
  return (
    <section className="mx-auto max-w-5xl p-4 md:pt-14">
      <PathNavTabs items={tabs} />
      {children}
    </section>
  )
}
