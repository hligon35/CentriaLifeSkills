import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import Home from '@/app/page'
import GreetingOverlay from '@/components/GreetingOverlay'

export default async function TherapistHomeBoardPage() {
  const user = await getSession()
  if (!user || user.role !== 'THERAPIST') redirect('/login')
  return (
    <main className="mx-auto max-w-3xl p-0">
      <GreetingOverlay userId={user.sub} />
      <Home />
    </main>
  )
}
