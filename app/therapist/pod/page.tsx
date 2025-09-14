import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function TherapistPodPage() {
  const user = await getSession()
  if (!user || user.role !== 'THERAPIST') redirect('/login')
  // Students assigned to this therapist in AM or PM slot
  const students = await prisma.student.findMany({
    where: { OR: [ { amTherapistId: user.sub }, { pmTherapistId: user.sub } ] },
    include: { parent: { select: { id: true, name: true, email: true } } }
  }) as any[]
  const bcbaIds = Array.from(new Set(students.map(s => s.bcbaId).filter(Boolean))) as string[]
  const bcbas = bcbaIds.length ? await prisma.user.findMany({ where: { id: { in: bcbaIds } }, select: { id: true, name: true, email: true } }) : []
  const bcbaById = Object.fromEntries(bcbas.map(b => [b.id, b])) as Record<string, { id: string; name: string | null; email: string }>

  const am = students.filter(s => s.amTherapistId === user.sub)
  const pm = students.filter(s => s.pmTherapistId === user.sub)

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-4">My Pod</h1>
      <section className="rounded border bg-white p-4 mb-4">
        <div className="font-medium mb-2">AM Group</div>
        <ul className="space-y-2">
          {am.map(s => (
            <li key={s.id} className="rounded border p-2">
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-gray-600">Parent: {s.parent?.name || s.parent?.email}</div>
              <div className="text-xs text-gray-600">BCBA: {s.bcbaId ? (bcbaById[s.bcbaId!]?.name || bcbaById[s.bcbaId!]?.email) : '—'}</div>
            </li>
          ))}
          {am.length === 0 && <li className="text-xs text-gray-600">No students assigned in AM.</li>}
        </ul>
      </section>
      <section className="rounded border bg-white p-4">
        <div className="font-medium mb-2">PM Group</div>
        <ul className="space-y-2">
          {pm.map(s => (
            <li key={s.id} className="rounded border p-2">
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-gray-600">Parent: {s.parent?.name || s.parent?.email}</div>
              <div className="text-xs text-gray-600">BCBA: {s.bcbaId ? (bcbaById[s.bcbaId!]?.name || bcbaById[s.bcbaId!]?.email) : '—'}</div>
            </li>
          ))}
          {pm.length === 0 && <li className="text-xs text-gray-600">No students assigned in PM.</li>}
        </ul>
      </section>
      <p className="mt-4 text-xs text-gray-500">Pods typically contain 5–8 students with AM/PM therapists under one BCBA.</p>
    </main>
  )
}
