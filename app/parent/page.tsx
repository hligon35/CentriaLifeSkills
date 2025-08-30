import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function ParentHome() {
  const user = await getSession()
  if (!user || user.role !== 'PARENT') redirect('/login')
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-4">Parent home</h1>
      <p className="text-sm text-gray-700">Your child’s updates and messages will appear here.</p>
    </main>
  )
}
