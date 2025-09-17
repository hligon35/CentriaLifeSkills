'use client'
import { useEffect, useState } from 'react'

type Student = { id: string; name?: string; firstName?: string; lastName?: string; parent?: { name?: string; email?: string } }

export default function ClientCaseload() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [composeFor, setComposeFor] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [visibility, setVisibility] = useState<'STAFF'|'PARENT'>('STAFF')
  const [busy, setBusy] = useState(false)
  const [logFor, setLogFor] = useState<string | null>(null)
  const [logNotes, setLogNotes] = useState('')
  const [logMinutes, setLogMinutes] = useState<number>(30)
  const [logDate, setLogDate] = useState<string>(()=> new Date().toISOString().slice(0,10))

  async function load() {
    setLoading(true)
    const data = await fetch('/api/therapist/caseload').then(r=>r.json()).catch(()=>[])
    setStudents(Array.isArray(data)? data : (data?.students ?? []))
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const fullName = (s: Student) => s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || s.id

  async function submitNote(studentId: string) {
    if (!noteText.trim()) return
    setBusy(true)
    const res = await fetch('/api/student-notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, text: noteText, visibility })
    })
    setBusy(false)
    if (res.ok) {
      setComposeFor(null)
      setNoteText('')
    }
  }

  async function submitDailyLog(studentId: string) {
    if (!logMinutes || logMinutes <= 0) return
    setBusy(true)
    const res = await fetch('/api/daily-logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, date: logDate, minutes: logMinutes, notes: logNotes })
    })
    setBusy(false)
    if (res.ok) {
      setLogFor(null)
      setLogNotes('')
      setLogMinutes(30)
      setLogDate(new Date().toISOString().slice(0,10))
    }
  }

  return (
    <>
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <ul className="space-y-3">
          {students.map(s => (
            <li key={s.id} className="rounded border bg-white p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{fullName(s)}</div>
                  {s.parent?.name && <div className="text-xs text-gray-600">Parent: {s.parent.name}{s.parent.email ? ` • ${s.parent.email}` : ''}</div>}
                </div>
                <div className="flex gap-2">
                  <button className="rounded border px-2 py-1 text-sm" onClick={()=>{ setComposeFor(s.id); setVisibility('STAFF') }}>Add note</button>
                  <button className="rounded border px-2 py-1 text-sm" onClick={()=>{ setLogFor(s.id) }}>Add daily log</button>
                </div>
              </div>
              {composeFor===s.id && (
                <div className="mt-3 space-y-2">
                  <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={3} className="w-full rounded border p-2 text-sm" placeholder="Write a note…" />
                  <div className="flex items-center justify-between">
                    <div className="text-sm flex items-center gap-2">
                      <label className="flex items-center gap-1"><input type="radio" name={`vis-${s.id}`} checked={visibility==='STAFF'} onChange={()=>setVisibility('STAFF')} /> Staff only</label>
                      <label className="flex items-center gap-1"><input type="radio" name={`vis-${s.id}`} checked={visibility==='PARENT'} onChange={()=>setVisibility('PARENT')} /> Visible to parent</label>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={busy} onClick={()=>setComposeFor(null)} className="rounded border px-2 py-1 text-sm">Cancel</button>
                      <button disabled={busy} onClick={()=>submitNote(s.id)} className="rounded bg-blue-600 text-white px-3 py-1 text-sm">{busy? 'Saving…' : 'Save note'}</button>
                    </div>
                  </div>
                </div>
              )}
              {logFor===s.id && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <label className="flex flex-col">Date
                      <input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} className="rounded border p-2" />
                    </label>
                    <label className="flex flex-col">Minutes
                      <input type="number" min={1} step={5} value={logMinutes} onChange={e=>setLogMinutes(Number(e.target.value))} className="rounded border p-2" />
                    </label>
                  </div>
                  <textarea value={logNotes} onChange={e=>setLogNotes(e.target.value)} rows={3} className="w-full rounded border p-2 text-sm" placeholder="Notes (optional)…" />
                  <div className="flex items-center justify-end gap-2">
                    <button disabled={busy} onClick={()=>setLogFor(null)} className="rounded border px-2 py-1 text-sm">Cancel</button>
                    <button disabled={busy} onClick={()=>submitDailyLog(s.id)} className="rounded bg-blue-600 text-white px-3 py-1 text-sm">{busy? 'Saving…' : 'Save log'}</button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {students.length===0 && <li className="text-gray-500">No students assigned.</li>}
        </ul>
      )}
    </>
  )
}
