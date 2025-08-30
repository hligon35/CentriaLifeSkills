import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function ParentTherapistsPage() {
  const user = await getSession()
  if (!user || user.role !== 'PARENT') redirect('/login')
  const students = await prisma.student.findMany({
    where: { parentId: user.sub },
    select: {
      id: true,
      name: true,
      amTherapist: { select: { id: true, name: true, email: true, photoUrl: true, role: true } },
      pmTherapist: { select: { id: true, name: true, email: true, photoUrl: true, role: true } }
    }
  })

  return (
  <main className="mx-auto max-w-3xl p-3 sm:p-4">
      <h1 className="text-xl font-semibold mb-4">Your Child's Therapists</h1>
      {students.length === 0 && (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">No assigned therapists found.</div>
      )}
      <div className="space-y-6">
        {students.map(stu => (
          <section key={stu.id} className="rounded border bg-white p-4">
            <div className="mb-3 font-medium">Student: {stu.name}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stu.amTherapist && (
                <TherapistCard t={stu.amTherapist} slotLabel="AM Therapist" />
              )}
              {stu.pmTherapist && (
                <TherapistCard t={stu.pmTherapist} slotLabel="PM Therapist" />
              )}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-500">For urgent concerns, use Messages or contact the school office.</p>
    </main>
  )
}

function TherapistCard({ t, slotLabel }: { t: { id: string; name: string | null; email: string; photoUrl: string | null; role?: string | null }, slotLabel: string }) {
  const initials = (t.name || t.email || '?').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()
  const avatar = t.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(initials)}`
  return (
    <div className="rounded-lg border p-4 flex gap-3 items-start">
  <img loading="lazy" src={avatar} alt={t.name || 'Therapist'} className="h-14 w-14 rounded-full border" />
      <div className="min-w-0">
        <div className="font-medium truncate">{t.name || 'Therapist'}</div>
        <div className="text-xs text-gray-600">{slotLabel}</div>
        <div className="text-sm text-gray-700 truncate">Email: {t.email}</div>
        {/* Insert additional work info here: certifications, room, hours */}
      </div>
    </div>
  )
}
