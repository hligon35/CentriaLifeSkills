import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import profilePng from '@/icons/profile.png'

function safeAvatar(url?: string | null) {
  if (!url) return profilePng as any
  try {
    const u = new URL(url)
    if (u.hostname.includes('api.dicebear.com')) return profilePng as any
  } catch {}
  return url
}

export default async function ParentTherapistsPage() {
  const user = await getSession()
  if (!user || user.role !== 'PARENT') redirect('/login')
  let students: any[] = []
  try {
    students = await prisma.student.findMany({
      where: { parentId: user.sub },
      include: {
        amTherapist: { select: { id: true, name: true, email: true, photoUrl: true, role: true } },
        pmTherapist: { select: { id: true, name: true, email: true, photoUrl: true, role: true } },
      }
    }) as any
      // Lookup BCBA user details in one query
    const bcbaIds = Array.from(new Set(students.map((s: any) => s.bcbaId).filter(Boolean))) as string[]
      if (bcbaIds.length) {
        const bcbaUsers = await prisma.user.findMany({ where: { id: { in: bcbaIds } }, select: { id: true, name: true, email: true, photoUrl: true } })
        const byId = Object.fromEntries(bcbaUsers.map(u => [u.id, u])) as Record<string, { id: string; name: string | null; email: string; photoUrl: string | null }>
      students = students.map((s: any) => ({ ...s, bcba: s.bcbaId ? byId[s.bcbaId] ?? null : null }))
      }
  } catch (e) {
    if (String(process.env.NODE_ENV) === 'production') throw e
    // In dev, show an empty state instead of crashing if DB isn't ready
    students = []
  }

  return (
  <main className="mx-auto max-w-3xl p-3 sm:p-4">
  <h1 className="text-xl font-semibold mb-4 text-center sm:text-left">Your Child&apos;s Therapists</h1>
      {students.length === 0 && (
        <div className="rounded border bg-white p-4 text-sm text-gray-600">No assigned therapists found.</div>
      )}
      <div className="space-y-6">
        {students.map((stu: {
          id: string;
          name: string;
          amTherapist: { id: string; name: string | null; email: string; photoUrl: string | null; role?: string | null } | null;
          pmTherapist: { id: string; name: string | null; email: string; photoUrl: string | null; role?: string | null } | null;
          bcba?: { id: string; name: string | null; email: string; photoUrl: string | null } | null;
        }) => (
          <section key={stu.id} className="rounded border bg-white p-4">
            <div className="mb-3 font-medium">Student: {stu.name}</div>
            {stu.bcba && (
              <div className="mb-4">
                <div className="text-sm text-gray-700 mb-1">BCBA</div>
                  <TherapistCard t={stu.bcba as any} slotLabel="Head Therapist (BCBA)" />
              </div>
            )}
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
  const avatar = safeAvatar(t.photoUrl)
  return (
    <div className="rounded-lg border p-4 flex gap-3 items-start">
  <Image width={56} height={56} src={avatar} alt={t.name || 'Therapist'} className="h-14 w-14 rounded-full border" />
      <div className="min-w-0">
        <div className="font-medium truncate">{t.name || 'Therapist'}</div>
        <div className="text-xs text-gray-600">{slotLabel}</div>
        <div className="text-sm text-gray-700 truncate">Email: {t.email}</div>
        {/* Insert additional work info here: certifications, room, hours */}
      </div>
    </div>
  )
}
