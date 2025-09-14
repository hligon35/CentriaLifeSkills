"use client"
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Slot = { id: string; weekday: number; startTime: string; endTime: string }

const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function TherapistAvailabilityPage() {
  const router = useRouter()
  const [items, setItems] = useState<Slot[]>([])
  const [weekday, setWeekday] = useState(1)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(me => { if (me?.user?.role !== 'THERAPIST' && me?.user?.role !== 'ADMIN') router.push('/login') }).catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    try {
      const r = await fetch('/api/availability')
      const j = await r.json()
      setItems(j.items || [])
    } catch { setItems([]) }
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const resp = await fetch('/api/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weekday, startTime, endTime }) })
      if (!resp.ok) throw new Error('Failed')
      setStartTime('09:00'); setEndTime('12:00');
      await refresh()
    } catch (e:any) {
      setError('Could not add slot')
    }
  }

  async function onDelete(id: string) {
    try {
      const resp = await fetch(`/api/availability?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!resp.ok) throw new Error('Failed')
      await refresh()
    } catch {}
  }

  const grouped = useMemo(() => {
    const g: Record<number, Slot[]> = {}
    for (const s of items) { (g[s.weekday] ||= []).push(s) }
    for (const k of Object.keys(g)) g[Number(k)].sort((a,b) => a.startTime.localeCompare(b.startTime))
    return g
  }, [items])

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-xl font-semibold mb-4">Therapist Availability</h1>
      <form onSubmit={onAdd} className="rounded border bg-white p-4 mb-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">Day<br/>
          <select className="rounded border px-2 py-1" value={weekday} onChange={e => setWeekday(Number(e.target.value))}>
            {days.map((d, idx) => <option key={d} value={idx}>{d}</option>)}
          </select>
        </label>
        <label className="text-sm">Start<br/>
          <input className="rounded border px-2 py-1" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </label>
        <label className="text-sm">End<br/>
          <input className="rounded border px-2 py-1" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </label>
        <button className="rounded bg-[#623394] text-white px-3 py-2" type="submit">Add</button>
        {error && <span role="alert" className="text-sm text-red-600">{error}</span>}
      </form>
      <div className="space-y-3">
        {days.map((d, idx) => (
          <section key={d} className="rounded border bg-white p-3">
            <div className="font-medium mb-2">{d}</div>
            <ul className="flex flex-wrap gap-2">
              {(grouped[idx] || []).map(s => (
                <li key={s.id} className="text-sm inline-flex items-center gap-2 rounded border px-2 py-1">
                  <span>{s.startTime} - {s.endTime}</span>
                  <button className="text-red-600" onClick={() => onDelete(s.id)} aria-label="Delete slot">&times;</button>
                </li>
              ))}
              {(grouped[idx] || []).length === 0 && <li className="text-xs text-gray-600">No slots</li>}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
