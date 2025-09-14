import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function StudentProfile({ params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) redirect('/login')
  const st = await prisma.student.findUnique({ where: { id: params.id }, include: { parent: true, amTherapist: true, pmTherapist: true } })
  if (!st) redirect('/parent')
  const allowed = user.role === 'ADMIN' || st.parentId === user.sub || st.amTherapistId === user.sub || st.pmTherapistId === user.sub
  if (!allowed) redirect('/parent')
  const [logs, notes, reports] = await Promise.all([
    prisma.dailyLog.findMany({ where: { studentId: st.id }, orderBy: { date: 'desc' }, take: 20 }),
    prisma.studentNote.findMany({ where: { studentId: st.id, ...(user.role === 'PARENT' ? { visibility: 'PARENT' } : {}) }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.progressReport.findMany({ where: { studentId: st.id }, orderBy: { createdAt: 'desc' }, take: 10 })
  ])
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-2">{st.name}</h1>
      <div className="text-sm text-gray-600 mb-4">AM Therapist: {st.amTherapist?.name} · PM Therapist: {st.pmTherapist?.name}</div>
      <section className="mb-6">
        <h2 className="font-medium mb-2">Daily Logs</h2>
        <ul className="space-y-2">
          {logs.map(l => (
            <li key={l.id} className="rounded border bg-white p-3">
              <div className="text-xs text-gray-500 mb-1">{new Date(l.date).toLocaleString()}</div>
              {l.activities && <div><span className="font-medium">Activities:</span> {l.activities}</div>}
              {l.meals && <div><span className="font-medium">Meals:</span> {l.meals}</div>}
              {l.naps && <div><span className="font-medium">Naps:</span> {l.naps}</div>}
              {l.notes && <div><span className="font-medium">Notes:</span> {l.notes}</div>}
            </li>
          ))}
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="font-medium mb-2">Notes</h2>
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id} className="rounded border bg-white p-3">
              <div className="text-xs text-gray-500 mb-1">{new Date(n.createdAt).toLocaleString()}</div>
              <div className="whitespace-pre-wrap">{n.body}</div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-medium mb-2">Progress Reports</h2>
        <ul className="space-y-2">
          {reports.map(r => (
            <li key={r.id} className="rounded border bg-white p-3">
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-gray-500 mb-1">{new Date(r.createdAt).toLocaleDateString()}</div>
              <div className="whitespace-pre-wrap">{r.body}</div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
