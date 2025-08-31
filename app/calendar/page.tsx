"use client"
import { useEffect, useMemo, useState } from 'react'

type CalEvent = { id: string; title: string; description?: string | null; audience: string; startAt: string; endAt?: string | null; location?: string | null }

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
      <div className="grid grid-cols-7 gap-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-xs text-center text-gray-600">{d}</div>)}
        {Array(first.getDay()).fill(0).map((_,i) => <div key={`sp-${i}`} />)}
        {days.map(d => {
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
          const todays = byDay[key] || []
          return (
            <div key={key} className="min-h-24 rounded border bg-white p-2">
              <div className="text-xs text-gray-600 mb-1">{d.getDate()}</div>
              <ul className="space-y-1">
                {todays.map(e => (
                  <li key={e.id} className="text-xs rounded bg-brand-50 border border-brand-200 px-2 py-1">
                    <div className="font-medium truncate">{e.title}</div>
                    {e.location && <div className="opacity-70 truncate">{e.location}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-gray-500">Events are filtered by your role. Admins can add events in settings or via API.</p>
    </main>
  )
}
