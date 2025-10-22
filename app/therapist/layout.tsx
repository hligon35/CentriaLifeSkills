import { ReactNode } from 'react'
import PathNavTabs from '@/components/PathNavTabs'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function TherapistSectionLayout({ children }: { children: ReactNode }) {
  const me = await getSession()
  if (!me || me.role !== 'THERAPIST') redirect('/login')
  const tabs = [
    { href: '/therapist', label: 'Home' },
    { href: '/therapist/messages', label: 'Messages' },
    { href: '/therapist/schedule', label: 'Schedule' },
    { href: '/therapist/settings', label: 'Settings' },
  ]
  return (
    <section className="mx-auto max-w-5xl p-4 md:pt-0">
      {/* Offset below fixed desktop header and remove top padding on md+ */}
      <PathNavTabs items={tabs} className="md:top-14" />
      {children}
    </section>
  )
}
