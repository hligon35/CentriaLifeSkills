import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
const ClientTimesheets = dynamic(() => import('@/app/therapist/timesheets/ClientTimesheets'), { ssr: false })

export default async function TherapistTimesheetsPage() {
  const me = await getSession()
  if (!me || me.role !== 'THERAPIST') redirect('/login')
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-4">Timesheets</h1>
      <ClientTimesheets />
    </main>
  )
}
