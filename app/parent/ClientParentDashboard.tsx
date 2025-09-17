'use client'
import { useEffect, useState } from 'react'

type Note = { id: string; createdAt: string; text: string; student?: { id: string; name?: string; firstName?: string; lastName?: string } }
type DailyLog = { id: string; date: string; minutes: number; notes?: string; student?: { id: string; name?: string; firstName?: string; lastName?: string } }

export default function ClientParentDashboard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [n, l] = await Promise.all([
          fetch('/api/student-notes?visibility=PARENT').then(r=>r.json()).catch(()=>[]),
          fetch('/api/daily-logs').then(r=>r.json()).catch(()=>[]),
        ])
        setNotes(Array.isArray(n) ? n : (n?.items ?? []))
        setLogs(Array.isArray(l) ? l : (l?.items ?? []))
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const fullName = (s?: { name?: string; firstName?: string; lastName?: string }) => s?.name || [s?.firstName, s?.lastName].filter(Boolean).join(' ')

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <section className="rounded border bg-white p-3">
        <div className="font-medium mb-2">Recent Notes</div>
        {loading ? <div className="text-gray-500">Loading…</div> : (
          <ul className="space-y-2 text-sm">
            {notes.slice(0,10).map(n => (
              <li key={n.id} className="rounded border p-2">
                <div className="text-gray-500 text-xs">{new Date(n.createdAt).toLocaleString()} • {fullName(n.student)}</div>
                <div>{n.text}</div>
              </li>
            ))}
            {notes.length===0 && <li className="text-gray-500">No notes yet.</li>}
          </ul>
        )}
      </section>
      <section className="rounded border bg-white p-3">
        <div className="font-medium mb-2">Recent Daily Logs</div>
        {loading ? <div className="text-gray-500">Loading…</div> : (
          <ul className="space-y-2 text-sm">
            {logs.slice(0,10).map(l => (
              <li key={l.id} className="rounded border p-2">
                <div className="text-gray-500 text-xs">{new Date(l.date).toLocaleDateString()} • {fullName(l.student)}</div>
                <div>{l.minutes} min{l.minutes===1?'':'s'}{l.notes ? ` — ${l.notes}` : ''}</div>
              </li>
            ))}
            {logs.length===0 && <li className="text-gray-500">No daily logs yet.</li>}
          </ul>
        )}
      </section>
    </div>
  )
}
