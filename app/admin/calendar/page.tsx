"use client"
import { useEffect, useState } from 'react'

type Therapist = { id: string; name: string | null; email?: string }
type Student = { id: string; name: string }

export default function AdminCalendarPage() {
  const [tab, setTab] = useState<'schedule-post'|'meeting'|'work-schedule'>('schedule-post')
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-center sm:text-left">Admin Calendar</h1>
        <div className="relative">
          <button
            className="rounded border px-3 py-1.5 text-sm"
            onClick={() => setMenuOpen(v => !v)}
          >Add</button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded border bg-white shadow">
                <button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setTab('schedule-post'); setMenuOpen(false) }}>
                  Upload flyer/document and schedule to message board
                </button>
                <button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setTab('meeting'); setMenuOpen(false) }}>
                  Request or schedule a therapist meeting
                </button>
                <button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setTab('work-schedule'); setMenuOpen(false) }}>
                  Post therapist work schedules (single or CSV)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        <button className={btn(tab==='schedule-post')} onClick={()=>setTab('schedule-post')}>Schedule Board Post</button>
        <button className={btn(tab==='meeting')} onClick={()=>setTab('meeting')}>Request/Schedule Meeting</button>
        <button className={btn(tab==='work-schedule')} onClick={()=>setTab('work-schedule')}>Therapist Work Schedules</button>
      </div>
      {tab === 'schedule-post' && <SchedulePost />}
      {tab === 'meeting' && <ScheduleMeeting />}
      {tab === 'work-schedule' && <WorkSchedules />}
    </main>
  )
}

function btn(active: boolean) {
  return `rounded border px-3 py-1 text-sm ${active ? 'bg-brand-600 text-white' : ''}`
}

function SchedulePost() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [publishAt, setPublishAt] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  async function uploadFileIfAny() {
    if (!file) return undefined
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Upload failed')
    const j = await res.json()
    // Optionally, could sign for public url; for now keep s3:// URL
    return j.url as string
  }

  async function schedule() {
    setBusy(true); setStatus('')
    try {
      const fileUrl = await uploadFileIfAny()
      const payload: any = { title, body }
      if (publishAt) payload.publishAt = new Date(publishAt).toISOString()
      if (fileUrl) payload.fileUrl = fileUrl
      // Setting published false if publishAt is in the future happens in API
      const res = await fetch('/api/board', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Failed to schedule')
      setStatus('Scheduled')
      setTitle(''); setBody(''); setPublishAt(''); setFile(null)
    } catch (e: any) { setStatus(e.message) } finally { setBusy(false) }
  }

  return (
    <section className="rounded border bg-white p-4">
      <div className="font-medium mb-2">Schedule a message board post</div>
      <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="mb-2 w-full rounded border px-3 py-2" placeholder="Body" value={body} onChange={e=>setBody(e.target.value)} />
      <div className="grid gap-2 sm:grid-cols-2 mb-2">
        <label className="text-sm">Publish at (optional)
          <input type="datetime-local" value={publishAt} onChange={e=>setPublishAt(e.target.value)} className="mt-1 w-full rounded border px-2 py-2" />
        </label>
        <label className="text-sm">Attach file (optional)
          <input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} className="mt-1 w-full rounded border px-2 py-2" />
        </label>
      </div>
      <button disabled={busy || !title.trim()} onClick={schedule} className="rounded border px-3 py-2 text-sm">{busy ? 'Scheduling…' : 'Schedule'}</button>
      {status && <div className="mt-2 text-xs text-gray-600">{status}</div>}
    </section>
  )
}

function ScheduleMeeting() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [therapistId, setTherapistId] = useState('')
  const [parentId, setParentId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/directory/staff?role=THERAPIST').then(r=>r.json()).then(d=>setTherapists(d.staff||[]))
    fetch('/api/directory/students').then(r=>r.json()).then(d=>setStudents(d.students||[]))
  }, [])

  async function createMeeting() {
    setBusy(true); setStatus('')
    try {
      const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ therapistId, parentId, studentId, startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString() }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Failed to schedule')
      setStatus('Scheduled')
      setTherapistId(''); setParentId(''); setStudentId(''); setStartAt(''); setEndAt('')
    } catch (e: any) { setStatus(e.message) } finally { setBusy(false) }
  }

  return (
    <section className="rounded border bg-white p-4">
      <div className="font-medium mb-2">Request or schedule a meeting</div>
      <div className="grid gap-2 sm:grid-cols-2 mb-2">
        <label className="text-sm">Therapist
          <select className="mt-1 w-full rounded border px-2 py-2" value={therapistId} onChange={e=>setTherapistId(e.target.value)}>
            <option value="">Select therapist</option>
            {therapists.map(t => <option key={t.id} value={t.id}>{t.name || t.email}</option>)}
          </select>
        </label>
        <label className="text-sm">Student
          <select className="mt-1 w-full rounded border px-2 py-2" value={studentId} onChange={e=>setStudentId(e.target.value)}>
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Parent ID
          <input className="mt-1 w-full rounded border px-2 py-2" value={parentId} onChange={e=>setParentId(e.target.value)} placeholder="Parent user id" />
        </label>
        <label className="text-sm">Start
          <input type="datetime-local" className="mt-1 w-full rounded border px-2 py-2" value={startAt} onChange={e=>setStartAt(e.target.value)} />
        </label>
        <label className="text-sm">End
          <input type="datetime-local" className="mt-1 w-full rounded border px-2 py-2" value={endAt} onChange={e=>setEndAt(e.target.value)} />
        </label>
      </div>
      <button disabled={busy || !studentId || !parentId || !startAt || !endAt} onClick={createMeeting} className="rounded border px-3 py-2 text-sm">{busy ? 'Scheduling…' : 'Schedule'}</button>
      {status && <div className="mt-2 text-xs text-gray-600">{status}</div>}
    </section>
  )
}

function WorkSchedules() {
  const [csv, setCsv] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function uploadCsv() {
    setBusy(true); setStatus('')
    try {
      const res = await fetch('/api/admin/work-shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Failed to upload')
      setStatus(`Imported ${j.imported}`)
      setCsv('')
    } catch (e: any) { setStatus(e.message) } finally { setBusy(false) }
  }

  return (
    <section className="rounded border bg-white p-4">
      <div className="font-medium mb-2">Post therapist work schedules</div>
      <p className="text-xs text-gray-600 mb-2">Paste CSV with columns: therapistEmail, studentName(optional), startAt(ISO), endAt(ISO)</p>
      <textarea className="w-full rounded border p-2 mb-2" rows={6} value={csv} onChange={e=>setCsv(e.target.value)} placeholder="therapist@org.com,Student A,2025-09-14T09:00:00Z,2025-09-14T17:00:00Z" />
      <button disabled={busy || !csv.trim()} onClick={uploadCsv} className="rounded border px-3 py-2 text-sm">{busy ? 'Uploading…' : 'Upload CSV'}</button>
      {status && <div className="mt-2 text-xs text-gray-600">{status}</div>}
    </section>
  )
}
