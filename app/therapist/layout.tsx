import { ReactNode } from 'react'
import PathNavTabs from '@/components/PathNavTabs'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function TherapistSectionLayout({ children }: { children: ReactNode }) {
  const me = await getSession()
  if (!me || me.role !== 'THERAPIST') redirect('/login')
  const tabs = [
    { href: '/', label: 'Home', activePaths: ['/', '/board'] },
    { href: '/chat', label: 'Messages' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/settings', label: 'Settings' },
    { href: '/therapist', label: 'Dashboard' },
    { href: '/therapist/caseload', label: 'Caseload' },
    { href: '/therapist/availability', label: 'Availability' },
    { href: '/therapist/timesheets', label: 'Timesheets' },
    { href: '/therapist/pod', label: 'My Pod' },
  ]
  return (
    <section className="mx-auto max-w-5xl p-4 md:pt-14">
      <PathNavTabs items={tabs} />
      {children}
    </section>
  )
}
