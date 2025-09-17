'use client'
import { useEffect, useState } from 'react'

export default function ClientDashboard() {
  const [clock, setClock] = useState<{ clockedIn: boolean; startedAt?: string | null; todayMs: number } | null>(null)
  const [today, setToday] = useState<{ shifts: any[]; appointments: any[]; events: any[] } | null>(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const [c, t] = await Promise.all([
      fetch('/api/therapist/clock').then(r=>r.json()).catch(()=>null),
      fetch('/api/therapist/shifts/today').then(r=>r.json()).catch(()=>null),
    ])
    setClock(c)
    setToday(t)
  }
  useEffect(() => { refresh() }, [])

  const fmtMs = (ms: number) => {
    const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000)
    return `${h}h ${m}m`
  }

  return (
    <>
      <section className="rounded border bg-white p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">Clock</div>
            <div className="text-gray-600">Today: {clock ? fmtMs(clock.todayMs) : '—'}</div>
          </div>
          <div>
            <button
              className="rounded border px-3 py-1 text-sm"
              disabled={busy}
              onClick={async ()=>{
                setBusy(true)
                const action = clock?.clockedIn ? 'stop' : 'start'
                await fetch('/api/therapist/clock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
                setBusy(false)
                refresh()
              }}
            >{busy ? 'Working…' : clock?.clockedIn ? 'Clock out' : 'Clock in'}</button>
          </div>
        </div>
      </section>
      <section className="rounded border bg-white p-3">
        <div className="font-medium mb-2">Today</div>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-gray-500 mb-1">Shifts</div>
            <ul className="space-y-1">
              {today?.shifts?.map((s:any)=>(
                <li key={s.id} className="rounded border px-2 py-1">{new Date(s.startAt).toLocaleTimeString()} – {new Date(s.endAt).toLocaleTimeString()} {s.student?.name ? `• ${s.student.name}` : ''}</li>
              ))}
              {(!today?.shifts || today.shifts.length===0) && <li className="text-gray-500">None</li>}
            </ul>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Appointments</div>
            <ul className="space-y-1">
              {today?.appointments?.map((a:any)=>(
                <li key={a.id} className="rounded border px-2 py-1">{new Date(a.startAt).toLocaleTimeString()} – {new Date(a.endAt).toLocaleTimeString()} {a.student?.name ? `• ${a.student.name}` : ''}</li>
              ))}
              {(!today?.appointments || today.appointments.length===0) && <li className="text-gray-500">None</li>}
            </ul>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Events</div>
            <ul className="space-y-1">
              {today?.events?.map((e:any)=>(
                <li key={e.id} className="rounded border px-2 py-1">{new Date(e.startAt).toLocaleTimeString()} – {e.title}</li>
              ))}
              {(!today?.events || today.events.length===0) && <li className="text-gray-500">None</li>}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
