import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
const ClientChildren = dynamic(() => import('@/app/parent/children/ClientChildren'), { ssr: false })

export default async function ParentChildrenPage() {
  const me = await getSession()
  if (!me || me.role !== 'PARENT') redirect('/login')
  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="text-xl font-semibold mb-4">My Children</h1>
      <ClientChildren />
    </main>
  )
}
