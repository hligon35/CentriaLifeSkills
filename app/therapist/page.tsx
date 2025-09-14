import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import GreetingOverlay from '@/components/GreetingOverlay'

export default async function TherapistHome() {
  const user = await getSession()
  if (!user || user.role !== 'THERAPIST') redirect('/login')
  return (
    <main className="mx-auto max-w-3xl p-4">
  <GreetingOverlay />
      <h1 className="text-xl font-semibold mb-4">Therapist dashboard</h1>
  <p className="text-sm text-gray-700">Use the navigation to access your messages and board.</p>
      <div className="mt-4">
        <a href="/therapist/pod" className="inline-block rounded bg-[#623394] text-white px-3 py-2">Open My Pod</a>
      </div>
    </main>
  )
}
