"use client"
import { useEffect, useMemo, useState } from 'react'

type CalEvent = { id: string; title: string; description?: string | null; audience: string; startAt: string; endAt?: string | null; location?: string | null; rsvpStatus?: 'YES' | 'NO' | 'MAYBE' | null }

export default function CalendarPage() {
  const [month, setMonth] = useState(() => new Date())
  const [events, setEvents] = useState<CalEvent[]>([])
  const ym = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}`

  useEffect(() => {
    fetch(`/api/calendar?month=${ym}`).then(r => r.json()).then(d => setEvents(d.events || [])).catch(() => setEvents([]))
  }, [ym])

  const byDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    for (const e of events) {
      const d = new Date(e.startAt)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      ;(map[key] ||= []).push(e)
    }
    return map
  }, [events])

  function shiftMonths(delta: number) {
    setMonth((m: Date) => new Date(m.getFullYear(), m.getMonth()+delta, 1))
  }

  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth()+1, 0)
  const days: Date[] = []
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(month.getFullYear(), month.getMonth(), d))

  return (
    <main className="mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-2">
          <button className="rounded border px-2 py-1" onClick={() => shiftMonths(-1)}>&larr; Prev</button>
          <div className="text-sm w-32 text-center">{first.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <button className="rounded border px-2 py-1" onClick={() => shiftMonths(1)}>Next &rarr;</button>
        </div>
      </div>
  <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="hidden md:block text-xs text-center text-gray-600">{d}</div>)}
        <div className="hidden md:contents">
          {Array(first.getDay()).fill(0).map((_,i) => <div key={`sp-${i}`} />)}
        </div>
        {days.map(d => {
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
          const todays = byDay[key] || []
          return (
            <div key={key} className="min-h-24 rounded border bg-white p-2">
              <div className="text-xs text-gray-600 mb-1">{d.getDate()}</div>
              <ul className="space-y-1">
                {todays.map(e => (
                  <li key={e.id} className="text-xs rounded bg-brand-50 border border-brand-200 px-2 py-1 relative">
                    <div className="font-medium truncate">{e.title}</div>
                    {e.location && <div className="opacity-70 truncate">{e.location}</div>}
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="mr-1 text-[10px] text-gray-700">RSVP:</span>
                      {(['YES','MAYBE','NO'] as const).map(val => (
                        <button
                          key={val}
                          className={`rounded px-1 py-0.5 text-[10px] border shrink-0 ${e.rsvpStatus===val? 'bg-[#623394] text-white border-[#623394]':'bg-white text-gray-800'}`}
                          onClick={async () => {
                            try {
                              await fetch('/api/events/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: e.id, status: val }) })
                              setEvents(prev => prev.map(ev => ev.id===e.id ? { ...ev, rsvpStatus: val }: ev))
                            } catch {}
                          }}
                          aria-label={`RSVP ${val}`}
                        >{val}</button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <p className="text-gray-600">Events are filtered by your role. Admins can add events in settings or via API.</p>
        <div className="flex items-center gap-3">
          <a className="inline-block rounded bg-[#623394] text-white px-3 py-1" href="/appointments">Open Appointments</a>
          <a className="inline-block rounded border px-3 py-1" href="/therapist/availability">Manage Availability (Therapists)</a>
        </div>
      </div>
    </main>
  )
}
