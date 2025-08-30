import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import GreetingOverlay from '@/components/GreetingOverlay'

export default async function ParentHome() {
  const user = await getSession()
  if (!user || user.role !== 'PARENT') redirect('/login')
  return (
    <main className="mx-auto max-w-3xl p-4">
  <GreetingOverlay />
      <h1 className="text-xl font-semibold mb-4">Parent home</h1>
  <p className="text-sm text-gray-700">Use the navigation to access updates and messages.</p>
    </main>
  )
}
