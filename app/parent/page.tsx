import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
const ClientParentDashboard = dynamic(() => import('@/app/parent/ClientParentDashboard'), { ssr: false })

export default async function ParentHomePage() {
  const me = await getSession()
  if (!me || me.role !== 'PARENT') redirect('/login')
  return (
    <main className="mx-auto max-w-4xl p-0">
      <h1 className="text-xl font-semibold mb-4">Welcome</h1>
      <ClientParentDashboard />
    </main>
  )
}
