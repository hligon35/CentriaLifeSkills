import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import BoardClient from '@/components/BoardClient'

export default async function ParentHomePage() {
  const me = await getSession()
  if (!me || me.role !== 'PARENT') redirect('/login')
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-4">Message Board</h1>
      <BoardClient />
    </main>
  )
}
