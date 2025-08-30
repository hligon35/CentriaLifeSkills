"use client"
import { useEffect, useState } from 'react'

type Memo = { id: string; title: string; body: string; active: boolean; audience: string; targetUserId?: string | null; expiresAt?: string | null }

export default function AdminMemosPage() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [draft, setDraft] = useState<Partial<Memo>>({ title: '', body: '', active: true, audience: 'ALL' })
  function load() { fetch('/api/urgent-memos').then(r => r.json()).then(d => setMemos(d.memos || [])) }
  useEffect(() => { load() }, [])
  async function save() {
    const res = await fetch('/api/urgent-memos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
    if (res.ok) { setDraft({ title: '', body: '', active: true, audience: 'ALL' }); load() }
  }
  async function toggle(id: string, active: boolean) {
    await fetch('/api/urgent-memos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active }) })
    load()
  }
  async function remove(id: string) {
    await fetch(`/api/urgent-memos?id=${id}`, { method: 'DELETE' }); load()
  }
  return (
    <main className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="text-xl font-semibold">Urgent memos</h1>
      <div className="rounded-lg border bg-white p-4 space-y-2">
        <div className="grid grid-cols-1 gap-2">
          <input className="rounded-lg border px-3 py-2" placeholder="Title" value={draft.title as string} onChange={e => setDraft({ ...draft, title: e.target.value })} />
          <textarea className="rounded-lg border px-3 py-2" placeholder="Body" value={draft.body as string} onChange={e => setDraft({ ...draft, body: e.target.value })} rows={4} />
          <div className="flex gap-2">
            <select className="rounded-lg border px-3 py-2" value={draft.audience as string} onChange={e => setDraft({ ...draft, audience: e.target.value })}>
              <option value="ALL">All users</option>
              <option value="THERAPIST">Therapists</option>
              <option value="PARENT">Parents</option>
              <option value="USER">Specific user</option>
            </select>
            {draft.audience === 'USER' && (
              <input className="rounded-lg border px-3 py-2 flex-1" placeholder="Target user ID" value={draft.targetUserId || ''} onChange={e => setDraft({ ...draft, targetUserId: e.target.value })} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm"><input type="checkbox" className="mr-2" checked={!!draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} /> Active</label>
            <input type="datetime-local" className="rounded-lg border px-3 py-2" onChange={e => setDraft({ ...draft, expiresAt: e.target.value })} />
          </div>
          <button onClick={save} className="rounded-lg bg-brand-600 text-white px-4 py-2 w-fit">Save memo</button>
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <div className="font-medium mb-2">Existing memos</div>
        <ul className="space-y-2">
          {memos.map(m => (
            <li key={m.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.title} {m.active ? '' : '(inactive)'} </div>
                  <div className="text-xs text-gray-600">Audience: {m.audience}{m.audience === 'USER' && m.targetUserId ? ` (${m.targetUserId})` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggle(m.id, !m.active)} className="rounded-lg border px-3 py-1 text-sm">{m.active ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => remove(m.id)} className="rounded-lg border px-3 py-1 text-sm">Delete</button>
                </div>
              </div>
              <div className="text-sm mt-2 whitespace-pre-wrap">{m.body}</div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
