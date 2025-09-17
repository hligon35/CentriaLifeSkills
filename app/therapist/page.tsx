import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import GreetingOverlay from '@/components/GreetingOverlay'
import dynamic from 'next/dynamic'
const ClientDashboard = dynamic(() => import('./ClientDashboard'), { ssr: false })

export default async function TherapistDashboardPage() {
  const user = await getSession()
  if (!user || user.role !== 'THERAPIST') redirect('/login')
  return (
    <main className="mx-auto max-w-4xl p-0">
      <GreetingOverlay />
      <h1 className="text-xl font-semibold mb-4">My Day</h1>
      <ClientDashboard />
    </main>
  )
}
