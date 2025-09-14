"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import profilePng from '@/icons/profile.png'

function safeAvatar(url?: string | null) {
  if (!url) return profilePng as any
  try {
    const u = new URL(url)
    if (u.hostname.includes('api.dicebear.com')) return profilePng as any
  } catch {}
  return url
}

type Staff = { id: string; name: string | null; email?: string; role: string; photoUrl?: string | null }
type Student = {
  id: string
  name: string
  parent?: { id: string; name: string | null; photoUrl?: string | null }
  amTherapist?: { id: string; name: string | null; photoUrl?: string | null }
  pmTherapist?: { id: string; name: string | null; photoUrl?: string | null }
}

export default function AdminDirectoryPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [sQuery, setSQuery] = useState('')
  const [stQuery, setStQuery] = useState('')
  const [csv, setCsv] = useState('')
  const [csvType, setCsvType] = useState<'users' | 'students'>('users')
  const [status, setStatus] = useState<string>('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [bulkTitle, setBulkTitle] = useState('')
  const [bulkBody, setBulkBody] = useState('')
  const [bulkExpiresAt, setBulkExpiresAt] = useState('')
  const [memoOpen, setMemoOpen] = useState(false)
  const [memoTarget, setMemoTarget] = useState<{ id: string; label: string } | null>(null)
  const [memoTitle, setMemoTitle] = useState('')
  const [memoBody, setMemoBody] = useState('')
  const [memoExpiresAt, setMemoExpiresAt] = useState('') // ISO string or empty
  const [memoBusy, setMemoBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/directory/staff?search=${encodeURIComponent(sQuery)}`)
      .then(r => r.json()).then(d => setStaff(d.staff || [])).catch(() => setStaff([]))
  }, [sQuery])

  useEffect(() => {
    fetch(`/api/directory/students?search=${encodeURIComponent(stQuery)}`)
      .then(r => r.json()).then(d => setStudents(d.students || [])).catch(() => setStudents([]))
  }, [stQuery])

  const importCsv = async () => {
    setStatus('Importing...')
    const res = await fetch('/api/admin/directory/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: csvType, csv }) })
    const j = await res.json()
    if (!res.ok) { setStatus(j.error || 'Import failed'); return }
    setStatus(`Imported ${j.imported}`)
    setCsv('')
    // refresh lists
    fetch(`/api/directory/staff?search=${encodeURIComponent(sQuery)}`).then(r => r.json()).then(d => setStaff(d.staff || []))
    fetch(`/api/directory/students?search=${encodeURIComponent(stQuery)}`).then(r => r.json()).then(d => setStudents(d.students || []))
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4 text-center sm:text-left">Admin Directory</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Staff</h2>
            <input value={sQuery} onChange={e=>setSQuery(e.target.value)} placeholder="Search staff" className="border rounded px-2 py-1 text-sm" />
          </div>
      <ul className="space-y-2">
            {staff.map(u => (
        <li key={u.id} className="flex items-center gap-3 border rounded p-3 bg-white active:scale-[0.99] transition">
                <input aria-label={`Select ${u.name || u.email || 'user'}`} type="checkbox" className="mt-0.5" checked={selectedUserIds.includes(u.id)} onChange={e => setSelectedUserIds(prev => e.target.checked ? [...new Set([...prev, u.id])] : prev.filter(x => x !== u.id))} />
                <Image src={safeAvatar(u.photoUrl)} alt={u.name||'User'} width={32} height={32} className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{u.name || u.email}</div>
                  <div className="text-xs text-gray-500">{u.role}{u.email ? ` · ${u.email}` : ''}</div>
                </div>
                <button
                  onClick={() => { setMemoTarget({ id: u.id, label: u.name || u.email || 'User' }); setMemoOpen(true) }}
                  className="text-xs rounded border px-2 py-1"
                  title="Send memo"
                >Memo</button>
              </li>
            ))}
            {staff.length === 0 && <li className="text-sm text-gray-600">No staff found.</li>}
          </ul>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Students</h2>
            <input value={stQuery} onChange={e=>setStQuery(e.target.value)} placeholder="Search students" className="border rounded px-2 py-1 text-sm" />
          </div>
      <ul className="space-y-2">
            {students.map(s => (
        <li key={s.id} className="border rounded p-3 bg-white">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  {s.parent && (
                    <div className="flex items-center gap-1">
                      <input aria-label={`Select parent ${s.parent?.name || ''}`} type="checkbox" className="mt-0.5" checked={selectedUserIds.includes((s.parent as any).id)} onChange={e => setSelectedUserIds(prev => e.target.checked ? [...new Set([...prev, (s.parent as any).id])] : prev.filter(x => x !== (s.parent as any).id))} />
                      <Badge avatar={s.parent.photoUrl} label={s.parent.name||'Parent'} />
                      <button
                        className="text-[11px] rounded border px-2 py-0.5"
                        onClick={() => { setMemoTarget({ id: (s.parent as any).id, label: s.parent?.name || 'Parent' }); setMemoOpen(true) }}
                        title="Send memo to parent"
                      >Memo</button>
                    </div>
                  )}
                  {s.amTherapist && (
                    <div className="flex items-center gap-1">
                      <input aria-label={`Select AM therapist ${s.amTherapist?.name || ''}`} type="checkbox" className="mt-0.5" checked={selectedUserIds.includes((s.amTherapist as any).id)} onChange={e => setSelectedUserIds(prev => e.target.checked ? [...new Set([...prev, (s.amTherapist as any).id])] : prev.filter(x => x !== (s.amTherapist as any).id))} />
                      <Badge avatar={s.amTherapist.photoUrl} label={s.amTherapist.name||'AM Therapist'} />
                      <button
                        className="text-[11px] rounded border px-2 py-0.5"
                        onClick={() => { setMemoTarget({ id: (s.amTherapist as any).id, label: s.amTherapist?.name || 'AM Therapist' }); setMemoOpen(true) }}
                        title="Send memo to AM therapist"
                      >Memo</button>
                    </div>
                  )}
                  {s.pmTherapist && (
                    <div className="flex items-center gap-1">
                      <input aria-label={`Select PM therapist ${s.pmTherapist?.name || ''}`} type="checkbox" className="mt-0.5" checked={selectedUserIds.includes((s.pmTherapist as any).id)} onChange={e => setSelectedUserIds(prev => e.target.checked ? [...new Set([...prev, (s.pmTherapist as any).id])] : prev.filter(x => x !== (s.pmTherapist as any).id))} />
                      <Badge avatar={s.pmTherapist.photoUrl} label={s.pmTherapist.name||'PM Therapist'} />
                      <button
                        className="text-[11px] rounded border px-2 py-0.5"
                        onClick={() => { setMemoTarget({ id: (s.pmTherapist as any).id, label: s.pmTherapist?.name || 'PM Therapist' }); setMemoOpen(true) }}
                        title="Send memo to PM therapist"
                      >Memo</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
            {students.length === 0 && <li className="text-sm text-gray-600">No students found.</li>}
          </ul>
        </section>
      </div>

      <div className="mt-8 border-t pt-4">
        <h2 className="font-medium mb-2">Import (CSV)</h2>
        <div className="flex items-center gap-2 mb-2">
          <select aria-label="CSV import type" value={csvType} onChange={e=>setCsvType(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
            <option value="users">Users (email,name,role,photoUrl)</option>
            <option value="students">Students (name,parentEmail,amTherapistEmail,pmTherapistEmail)</option>
          </select>
          <button onClick={importCsv} className="rounded border px-3 py-1 text-sm">Import</button>
          <span className="text-sm text-gray-600">{status}</span>
        </div>
        <textarea value={csv} onChange={e=>setCsv(e.target.value)} rows={5} placeholder="Paste CSV here" className="w-full border rounded p-2 text-sm font-mono" />
        <p className="text-xs text-gray-500 mt-1">Note: Simple CSV parser—no embedded commas or quotes.</p>
      </div>

      <div className="mt-8 border-t pt-4">
        <h2 className="font-medium mb-2">Bulk memo to selected users</h2>
        <div className="text-xs text-gray-600 mb-2">Selected: {selectedUserIds.length}</div>
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input value={bulkTitle} onChange={e=>setBulkTitle(e.target.value)} placeholder="Title" className="border rounded px-2 py-1 text-sm" />
          <input aria-label="Bulk memo expiration" type="datetime-local" value={bulkExpiresAt} onChange={e=>setBulkExpiresAt(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          <textarea value={bulkBody} onChange={e=>setBulkBody(e.target.value)} placeholder="Message" rows={3} className="sm:col-span-2 border rounded p-2 text-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={async () => {
              if (!bulkTitle || !bulkBody) { setStatus('Title and body required'); return }
              if (selectedUserIds.length === 0) { setStatus('No users selected'); return }
              const res = await fetch('/api/urgent-memos/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: bulkTitle, body: bulkBody, expiresAt: bulkExpiresAt || null, userIds: selectedUserIds }) })
              const j = await res.json()
              if (!res.ok) { setStatus(j.error || 'Bulk memo failed'); return }
              setStatus(`Sent to ${j.created}`)
              setBulkTitle(''); setBulkBody(''); setBulkExpiresAt('')
            }}
          >Send bulk memo</button>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => setSelectedUserIds([])}>Clear selection</button>
          <span className="text-sm text-gray-600">or send to role:</span>
          <button className="rounded border px-3 py-1 text-sm" onClick={async () => {
            if (!bulkTitle || !bulkBody) { setStatus('Title and body required'); return }
            const res = await fetch('/api/urgent-memos/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: bulkTitle, body: bulkBody, expiresAt: bulkExpiresAt || null, audienceRole: 'PARENT' }) })
            const j = await res.json(); if (!res.ok) { setStatus(j.error || 'Bulk memo failed'); return }
            setStatus(`Sent to Parents: ${j.created}`)
            setBulkTitle(''); setBulkBody(''); setBulkExpiresAt('')
          }}>Parents</button>
          <button className="rounded border px-3 py-1 text-sm" onClick={async () => {
            if (!bulkTitle || !bulkBody) { setStatus('Title and body required'); return }
            const res = await fetch('/api/urgent-memos/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: bulkTitle, body: bulkBody, expiresAt: bulkExpiresAt || null, audienceRole: 'THERAPIST' }) })
            const j = await res.json(); if (!res.ok) { setStatus(j.error || 'Bulk memo failed'); return }
            setStatus(`Sent to Therapists: ${j.created}`)
            setBulkTitle(''); setBulkBody(''); setBulkExpiresAt('')
          }}>Therapists</button>
          <span className="text-sm text-gray-600">{status}</span>
        </div>
      </div>

      <div className="mt-8 border-t pt-4">
        <h2 className="font-medium mb-2">Recent admin actions</h2>
        <AuditList />
      </div>

      {/* Memo Modal */}
      {memoOpen && memoTarget && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded bg-white shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Send memo to {memoTarget.label}</h3>
              <button className="text-sm" onClick={() => { setMemoOpen(false); setMemoTitle(''); setMemoBody(''); setMemoExpiresAt('') }}>Close</button>
            </div>
            <div className="space-y-2">
              <input value={memoTitle} onChange={e=>setMemoTitle(e.target.value)} placeholder="Title" className="w-full border rounded px-2 py-1 text-sm" />
              <textarea value={memoBody} onChange={e=>setMemoBody(e.target.value)} placeholder="Message" rows={4} className="w-full border rounded p-2 text-sm" />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">Expires At</label>
                <input aria-label="Memo expiration" type="datetime-local" value={memoExpiresAt} onChange={e=>setMemoExpiresAt(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button className="rounded border px-3 py-1 text-sm" onClick={() => { setMemoOpen(false) }} disabled={memoBusy}>Cancel</button>
                <button
                  className="rounded border px-3 py-1 text-sm"
                  onClick={async () => {
                    if (!memoTitle || !memoBody) { setStatus('Title and body required'); return }
                    setMemoBusy(true)
                    const res = await fetch('/api/urgent-memos', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: memoTitle,
                        body: memoBody,
                        active: true,
                        audience: 'USER',
                        targetUserId: memoTarget.id,
                        expiresAt: memoExpiresAt ? new Date(memoExpiresAt).toISOString() : null,
                      })
                    })
                    const j = await res.json()
                    setMemoBusy(false)
                    if (!res.ok) { setStatus(j.error || 'Failed to send memo'); return }
                    setStatus('Memo sent')
                    setMemoOpen(false); setMemoTitle(''); setMemoBody(''); setMemoExpiresAt('')
                  }}
                  disabled={memoBusy}
                >{memoBusy ? 'Sending…' : 'Send memo'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Badge({ avatar, label }: { avatar?: string | null; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 border rounded px-2 py-1 text-xs bg-white">
  <Image src={safeAvatar(avatar)} alt={label} width={20} height={20} className="h-5 w-5 rounded-full" />
      {label}
    </span>
  )
}

function AuditList() {
  const [logs, setLogs] = useState<Array<{ id: string; action: string; entity: string; entityId?: string | null; details?: string | null; createdAt: string }>>([])
  useEffect(() => { fetch('/api/admin/audit').then(r => r.json()).then(d => setLogs(d.logs || [])) }, [])
  return (
    <ul className="text-xs space-y-1 max-h-48 overflow-auto border rounded p-2 bg-white">
      {logs.map(l => (
        <li key={l.id} className="flex justify-between gap-2">
          <span>{new Date(l.createdAt).toLocaleString()}</span>
          <span className="flex-1 text-right">{l.action} · {l.entity}{l.entityId ? `(${l.entityId})` : ''}</span>
        </li>
      ))}
      {logs.length === 0 && <li className="text-gray-600">No recent actions.</li>}
    </ul>
  )
}
