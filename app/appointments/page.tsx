"use client"
import { useEffect, useMemo, useState } from 'react'

type Appt = { id: string; therapistId: string; parentId: string; studentId: string; startAt: string; endAt: string; status: string; student?: { id: string; name: string }; therapist?: { id: string; name: string; email: string }; parent?: { id: string; name: string; email: string } }

export default function AppointmentsPage() {
  const [role, setRole] = useState<string>('')
  const [items, setItems] = useState<Appt[]>([])
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([])
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState<string>('')
  const [start, setStart] = useState<string>('10:00')
  const [end, setEnd] = useState<string>('10:30')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => setRole(j?.user?.role || '')).catch(() => setRole(''))
  }, [])

  useEffect(() => {
    if (!role) return
    setLoading(true)
    fetch(`/api/appointments?role=${encodeURIComponent(role)}`).then(r => r.json()).then(j => setItems(j.items || [])).catch(() => setItems([])).finally(() => setLoading(false))
    if (role === 'PARENT') {
      fetch('/api/directory/students').then(r => r.json()).then(j => setStudents(j.students || [])).catch(() => setStudents([]))
    }
  }, [role])

  async function updateStatus(id: string, status: string) {
    try {
      const r = await fetch('/api/appointments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
      if (!r.ok) throw new Error('fail')
      setItems(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    } catch {}
  }

  const groups = useMemo(() => {
    const now = new Date()
    return {
      upcoming: items.filter(a => new Date(a.startAt) >= now),
      past: items.filter(a => new Date(a.startAt) < now)
    }
  }, [items])

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-4">Appointments</h1>
      {role === 'PARENT' && (
        <section className="rounded border bg-white p-4 mb-6">
          <div className="font-medium mb-2">Request BCBA Meeting</div>
          <form className="flex flex-wrap items-end gap-2" onSubmit={async (e) => {
            e.preventDefault()
            setErr(null)
            try {
              const d = new Date(date)
              const [sh, sm] = start.split(':').map(Number)
              const [eh, em] = end.split(':').map(Number)
              const startAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm)
              const endAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em)
              const me = await fetch('/api/auth/me').then(r=>r.json())
              const parentId = me?.user?.sub
              const resp = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId, studentId, startAt: startAt.toISOString(), endAt: endAt.toISOString() }) })
              if (!resp.ok) throw new Error('request failed')
              const created = await resp.json()
              setItems(prev => [...prev, created])
              setStudentId(''); setDate('')
            } catch (e:any) {
              setErr('Could not request meeting. Please check your inputs.')
            }
          }}>
            <label className="text-sm">Student<br/>
              <select className="rounded border px-2 py-1" value={studentId} onChange={e => setStudentId(e.target.value)} required>
                <option value="">Select…</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="text-sm">Date<br/>
              <input className="rounded border px-2 py-1" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </label>
            <label className="text-sm">Start<br/>
              <input className="rounded border px-2 py-1" type="time" value={start} onChange={e => setStart(e.target.value)} required />
            </label>
            <label className="text-sm">End<br/>
              <input className="rounded border px-2 py-1" type="time" value={end} onChange={e => setEnd(e.target.value)} required />
            </label>
            <button className="rounded bg-[#623394] text-white px-3 py-2" type="submit">Request</button>
            {err && <span role="alert" className="text-sm text-red-600">{err}</span>}
          </form>
          <p className="mt-2 text-xs text-gray-600">Requests go to your child’s assigned BCBA.</p>
        </section>
      )}
      {loading && <div className="text-sm text-gray-600">Loading…</div>}
      {!loading && (
        <div className="space-y-6">
          <section>
            <div className="font-medium mb-2">Upcoming</div>
            <ul className="space-y-2">
              {groups.upcoming.map(a => (
                <li key={a.id} className="rounded border bg-white p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{new Date(a.startAt).toLocaleString()} – {new Date(a.endAt).toLocaleTimeString()}</div>
                    <div className="text-xs text-gray-600 truncate">Student: {a.student?.name || a.studentId} • BCBA: {a.therapist?.name || a.therapistId}</div>
                    <div className="text-xs text-gray-600">Status: {a.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {role !== 'ADMIN' && (
                      <>
                        <button className={`rounded px-2 py-1 border ${a.status==='CONFIRMED'?'bg-[#623394] text-white border-[#623394]':''}`} onClick={() => updateStatus(a.id, 'CONFIRMED')}>Confirm</button>
                        <button className={`rounded px-2 py-1 border ${a.status==='CANCELLED'?'bg-red-600 text-white border-red-600':''}`} onClick={() => updateStatus(a.id, 'CANCELLED')}>Cancel</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
              {groups.upcoming.length === 0 && <li className="text-sm text-gray-600">No upcoming appointments.</li>}
            </ul>
          </section>
          <section>
            <div className="font-medium mb-2">Past</div>
            <ul className="space-y-2">
              {groups.past.map(a => (
                <li key={a.id} className="rounded border bg-white p-3">
                  <div className="text-sm">{new Date(a.startAt).toLocaleString()} – {new Date(a.endAt).toLocaleTimeString()}</div>
                  <div className="text-xs text-gray-600">Status: {a.status}</div>
                </li>
              ))}
              {groups.past.length === 0 && <li className="text-sm text-gray-600">No past appointments.</li>}
            </ul>
          </section>
        </div>
      )}
    </main>
  )
}
