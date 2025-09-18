'use client'
import { useEffect, useState } from 'react'

export default function ClientDashboard() {
  const [today, setToday] = useState<{ shifts: any[]; events: any[] } | null>(null)
  const [podLoading, setPodLoading] = useState(true)
  const [am, setAm] = useState<any[]>([])
  const [pm, setPm] = useState<any[]>([])

  async function refresh() {
    const t = await fetch('/api/therapist/shifts/today').then(r=>r.json()).catch(()=>null)
    setToday(t)
  }
  useEffect(() => { refresh() }, [])
  useEffect(()=>{
    (async()=>{
      setPodLoading(true)
      const res = await fetch('/api/therapist/pod').then(r=>r.json()).catch(()=>null)
      if (res) { setAm(res.am||[]); setPm(res.pm||[]) }
      setPodLoading(false)
    })()
  },[])

  const fmtMs = (ms: number) => {
    const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000)
    return `${h}h ${m}m`
  }

  return (
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
          <div className="md:col-span-1">
            <div className="text-gray-500 mb-1">Pod Groups</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border p-2">
                <div className="text-xs font-medium mb-1">AM</div>
                <ul className="space-y-1 max-h-40 overflow-auto pr-1">
                  {podLoading && <li className="text-gray-500 text-xs">Loading…</li>}
                  {!podLoading && am.length===0 && <li className="text-gray-500 text-xs">None</li>}
                  {am.map(s => (
                    <li key={s.id} className="text-[11px] leading-tight">{s.name}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded border p-2">
                <div className="text-xs font-medium mb-1">PM</div>
                <ul className="space-y-1 max-h-40 overflow-auto pr-1">
                  {podLoading && <li className="text-gray-500 text-xs">Loading…</li>}
                  {!podLoading && pm.length===0 && <li className="text-gray-500 text-xs">None</li>}
                  {pm.map(s => (
                    <li key={s.id} className="text-[11px] leading-tight">{s.name}</li>
                  ))}
                </ul>
              </div>
            </div>
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
  )
}

export function TherapistClockSection() {
  const [clock, setClock] = useState<{ clockedIn: boolean; startedAt?: string | null; todayMs: number } | null>(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const c = await fetch('/api/therapist/clock').then(r=>r.json()).catch(()=>null)
    setClock(c)
  }
  useEffect(()=>{ refresh() }, [])
  const fmtMs = (ms: number) => { const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000); return `${h}h ${m}m` }
  return (
    <section className="rounded border bg-white p-3 mb-6">
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
  )
}
