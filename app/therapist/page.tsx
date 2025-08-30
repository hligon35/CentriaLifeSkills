import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function TherapistHome() {
  const user = await getSession()
  if (!user || user.role !== 'THERAPIST') redirect('/login')
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-4">Therapist dashboard</h1>
      <p className="text-sm text-gray-700">Welcome back. Quick links to sessions, notes, and parent messages will go here.</p>
    </main>
  )
}
