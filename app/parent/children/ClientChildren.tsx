'use client'
import { useEffect, useState } from 'react'

type Child = { id: string; name?: string; firstName?: string; lastName?: string }
type Note = { id: string; createdAt: string; text: string }
type DailyLog = { id: string; date: string; minutes: number; notes?: string }

export default function ClientChildren() {
  const [children, setChildren] = useState<Child[]>([])
  const [selected, setSelected] = useState<string>('')
  const [notes, setNotes] = useState<Note[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const kids = await fetch('/api/parent/children').then(r=>r.json()).catch(()=>[])
        const list: Child[] = Array.isArray(kids) ? kids : (kids?.items ?? [])
        setChildren(list)
        if (list.length) setSelected(list[0].id)
      } finally { setLoading(false) }
    }
    init()
  }, [])

  useEffect(() => {
    async function load() {
      if (!selected) return
      setLoading(true)
      try {
        const [n, l] = await Promise.all([
          fetch(`/api/student-notes?visibility=PARENT&studentId=${encodeURIComponent(selected)}`).then(r=>r.json()).catch(()=>[]),
          fetch(`/api/daily-logs?studentId=${encodeURIComponent(selected)}`).then(r=>r.json()).catch(()=>[]),
        ])
        setNotes(Array.isArray(n) ? n : (n?.items ?? []))
        setLogs(Array.isArray(l) ? l : (l?.items ?? []))
      } finally { setLoading(false) }
    }
    load()
  }, [selected])

  const fullName = (c: Child) => c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm">Child</label>
        <select className="rounded border px-2 py-1 text-sm" value={selected} onChange={e=>setSelected(e.target.value)}>
          {children.map(c => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
        </select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded border bg-white p-3">
          <div className="font-medium mb-2">Notes</div>
          {loading ? <div className="text-gray-500">Loading…</div> : (
            <ul className="space-y-2 text-sm">
              {notes.map(n => (
                <li key={n.id} className="rounded border p-2">
                  <div className="text-gray-500 text-xs">{new Date(n.createdAt).toLocaleString()}</div>
                  <div>{n.text}</div>
                </li>
              ))}
              {notes.length===0 && <li className="text-gray-500">No notes.</li>}
            </ul>
          )}
        </section>
        <section className="rounded border bg-white p-3">
          <div className="font-medium mb-2">Daily Logs</div>
          {loading ? <div className="text-gray-500">Loading…</div> : (
            <ul className="space-y-2 text-sm">
              {logs.map(l => (
                <li key={l.id} className="rounded border p-2">
                  <div className="text-gray-500 text-xs">{new Date(l.date).toLocaleDateString()}</div>
                  <div>{l.minutes} min{l.minutes===1?'':'s'}{l.notes ? ` — ${l.notes}` : ''}</div>
                </li>
              ))}
              {logs.length===0 && <li className="text-gray-500">No daily logs.</li>}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
