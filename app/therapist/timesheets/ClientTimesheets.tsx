'use client'
import { useCallback, useEffect, useState } from 'react'

type WeekData = { weekStart: string; totalMs: number; days: Record<string, number> }

export default function ClientTimesheets() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day); // Sunday
    start.setHours(0,0,0,0)
    return start.toISOString()
  })
  const [data, setData] = useState<WeekData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/therapist/timesheet?weekStart=${encodeURIComponent(weekStart)}`)
    const json = await res.json().catch(()=>null)
    setData(json)
    setLoading(false)
  }, [weekStart])
  useEffect(()=>{ load() }, [load])

  function shiftWeek(deltaDays: number) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + deltaDays)
    setWeekStart(d.toISOString())
  }

  const fmtMs = (ms: number) => {
    const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000)
    return `${h}h ${m}m`
  }

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>shiftWeek(-7)}>Prev</button>
        <div className="text-sm text-gray-700">Week of {new Date(weekStart).toLocaleDateString()}</div>
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>shiftWeek(7)}>Next</button>
      </div>
      {loading ? <div className="text-gray-500">Loading…</div> : (
        <div className="rounded border bg-white p-3">
          <div className="grid grid-cols-7 gap-2 text-sm">
            {days.map((d, idx)=>{
              const key = new Date(new Date(weekStart).setDate(new Date(weekStart).getDate()+idx)).toISOString().slice(0,10)
              const ms = data?.days?.[key] ?? 0
              return (
                <div key={idx} className="rounded border p-2">
                  <div className="text-gray-500 text-xs mb-1">{d}</div>
                  <div className="font-medium">{fmtMs(ms)}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 text-right text-sm">Total: <span className="font-medium">{fmtMs(data?.totalMs ?? 0)}</span></div>
        </div>
      )}
    </>
  )
}
