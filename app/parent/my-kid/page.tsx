import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { safeAvatar } from '@/lib/media'

export default async function ParentMyKidPage() {
  const user = await getSession()
  if (!user || user.role !== 'PARENT') redirect('/login')

  let students: any[] = []
  try {
    students = await prisma.student.findMany({
      where: { parentId: user.sub },
      include: {
        amTherapist: { select: { id: true, name: true, email: true, photoUrl: true } },
        pmTherapist: { select: { id: true, name: true, email: true, photoUrl: true } },
        bcba: { select: { id: true, name: true, email: true, photoUrl: true } },
      }
    }) as any
  } catch {
    students = []
  }

  if (students.length === 0) {
    return (
      <main className="mx-auto max-w-4xl p-4">
        <h1 className="text-xl font-semibold mb-4">My Kid</h1>
        <div className="rounded border bg-white p-6 text-sm text-gray-600">No student profile is currently linked to this account.</div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl p-4 space-y-8">
      <h1 className="text-xl font-semibold">My Kid</h1>
      {students.map(stu => {
        const photo = safeAvatar(stu.photoUrl)
        return (
          <section key={stu.id} className="rounded border bg-white p-4 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex items-center gap-4">
                <Image src={photo} alt={stu.name} width={96} height={96} className="h-24 w-24 rounded-full object-cover border bg-gray-100" />
                <div>
                  <div className="text-lg font-medium">{stu.name}</div>
                  <div className="text-xs text-gray-500">Student ID: {stu.id.slice(0,8)}</div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {stu.bcba && (
                <TherapistCard t={stu.bcba} label="BCBA / Head Therapist" />
              )}
              {stu.amTherapist && (
                <TherapistCard t={stu.amTherapist} label="AM Therapist" />
              )}
              {stu.pmTherapist && (
                <TherapistCard t={stu.pmTherapist} label="PM Therapist" />
              )}
            </div>
            <div className="text-xs text-gray-500">For urgent concerns please use Messages or contact the office directly.</div>
          </section>
        )
      })}
    </main>
  )
}

function TherapistCard({ t, label }: { t: { id: string; name: string | null; email: string; photoUrl: string | null }; label: string }) {
  const avatar = safeAvatar(t.photoUrl)
  return (
    <div className="rounded border p-3 flex gap-3 items-start bg-gray-50">
      <Image src={avatar} alt={t.name || 'Therapist'} width={56} height={56} className="h-14 w-14 rounded-full object-cover border" />
      <div className="min-w-0 text-sm">
        <div className="font-medium truncate">{t.name || 'Therapist'}</div>
        <div className="text-xs text-gray-600 mb-1">{label}</div>
        <div className="text-gray-700 truncate">{t.email}</div>
      </div>
    </div>
  )
}