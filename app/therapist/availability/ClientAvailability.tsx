'use client'
import { useEffect, useState } from 'react'

type Slot = { id?: string; dayOfWeek: number; startTime: string; endTime: string }

export default function ClientAvailability() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(()=>{
    (async()=>{
      setLoading(true)
      const data = await fetch('/api/therapist/availability').then(r=>r.json()).catch(()=>[])
      setSlots(Array.isArray(data)? data : (data?.slots ?? []))
      setLoading(false)
    })()
  },[])

  function addSlot() {
    setSlots(prev => [...prev, { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }])
  }
  function updateSlot(i:number, patch: Partial<Slot>) {
    setSlots(prev => prev.map((s,idx)=> idx===i ? { ...s, ...patch } : s))
  }
  function removeSlot(i:number) { setSlots(prev => prev.filter((_,idx)=>idx!==i)) }

  async function save() {
    setBusy(true)
    await fetch('/api/therapist/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slots }) })
    setBusy(false)
  }

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <div className="space-y-3">
      {loading ? <div className="text-gray-500">Loading…</div> : (
        <>
          <div className="flex justify-between">
            <button className="rounded border px-3 py-1 text-sm" onClick={addSlot}>Add slot</button>
            <button className="rounded bg-blue-600 text-white px-3 py-1 text-sm" disabled={busy} onClick={save}>{busy? 'Saving…' : 'Save'}</button>
          </div>
          <ul className="space-y-2">
            {slots.map((s, i) => (
              <li key={i} className="grid grid-cols-12 items-center gap-2 rounded border bg-white p-2">
                <select className="col-span-3 rounded border p-1 text-sm" value={s.dayOfWeek} onChange={e=>updateSlot(i, { dayOfWeek: parseInt(e.target.value) })}>
                  {days.map((d, idx)=> <option key={idx} value={idx}>{d}</option>)}
                </select>
                <input className="col-span-3 rounded border p-1 text-sm" type="time" value={s.startTime} onChange={e=>updateSlot(i, { startTime: e.target.value })} />
                <input className="col-span-3 rounded border p-1 text-sm" type="time" value={s.endTime} onChange={e=>updateSlot(i, { endTime: e.target.value })} />
                <button className="col-span-3 rounded border px-2 py-1 text-sm" onClick={()=>removeSlot(i)}>Remove</button>
              </li>
            ))}
            {slots.length===0 && <li className="text-gray-500">No availability set.</li>}
          </ul>
        </>
      )}
    </div>
  )
}
