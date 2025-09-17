import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

const ClientCaseload = dynamic(() => import('./ClientCaseload'), { ssr: false })

export default async function TherapistCaseloadPage() {
  const me = await getSession()
  if (!me || me.role !== 'THERAPIST') redirect('/login')
  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="text-xl font-semibold mb-4">Caseload</h1>
      <ClientCaseload />
    </main>
  )
}
