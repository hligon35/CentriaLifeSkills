'use client'
import { useEffect, useState } from 'react'

interface Invite {
  id: string
  email: string
  role: string
  token: string
  createdAt: string
  expiresAt?: string | null
  consumedAt?: string | null
}

export default function InviteManager() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'THERAPIST'|'PARENT'|'ADMIN'>('THERAPIST')
  const [hours, setHours] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    const res = await fetch('/api/admin/invites')
    if (res.ok) {
      const j = await res.json()
      setInvites(j.invites || [])
    }
  }
  useEffect(() => { load() }, [])

  async function createInvite() {
    setError(null)
    setCreating(true)
    const body: any = { email, role }
    if (hours !== '') body.expiresInHours = Number(hours)
    const res = await fetch('/api/admin/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Failed to create invite')
      setCreating(false)
      return
    }
    setEmail('')
    setHours('')
    await load()
    setCreating(false)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-lg">Invites</h2>
        <p className="text-xs text-gray-500">Create and manage invitation links for new users.</p>
      </div>
      <div className="rounded border p-4 space-y-3 bg-white">
        {error && <div className="text-sm rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2">{error}</div>}
        <div className="flex flex-col gap-2">
          <input className="rounded border px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="flex gap-2">
            <select className="rounded border px-3 py-2" value={role} onChange={e => setRole(e.target.value as any)}>
              <option value="THERAPIST">Therapist</option>
              <option value="PARENT">Parent</option>
              <option value="ADMIN">Admin</option>
            </select>
            <input className="w-32 rounded border px-3 py-2" placeholder="Expires (h)" value={hours} onChange={e => setHours(e.target.value === '' ? '' : Number(e.target.value))} />
            <button disabled={creating} onClick={createInvite} className="rounded bg-brand-600 text-white px-4 py-2 disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
        <div className="text-xs text-gray-500">Leave expires blank for no expiration. Share the generated link only with the intended recipient.</div>
      </div>
      <div className="rounded border bg-white divide-y">
        <div className="px-4 py-2 text-xs uppercase tracking-wide text-gray-500 flex">
          <div className="w-48">Email</div>
          <div className="w-24">Role</div>
          <div className="w-56">Status</div>
          <div className="flex-1">Link</div>
        </div>
        {invites.map(inv => {
          const link = `${origin}/register?token=${inv.token}`
          const status = inv.consumedAt ? 'Used' : (inv.expiresAt && new Date(inv.expiresAt) < new Date() ? 'Expired' : 'Active')
          return (
            <div key={inv.id} className="px-4 py-2 text-sm flex items-center gap-2">
              <div className="w-48 truncate" title={inv.email}>{inv.email}</div>
              <div className="w-24">{inv.role}</div>
              <div className="w-56">{status}</div>
              <div className="flex-1 truncate">
                {status === 'Active' ? (
                  <button onClick={() => { navigator.clipboard.writeText(link) }} className="underline text-blue-600">Copy link</button>
                ) : <span className="text-gray-400">(unavailable)</span>}
              </div>
            </div>
          )
        })}
        {invites.length === 0 && <div className="px-4 py-6 text-sm text-gray-500">No invites yet.</div>}
      </div>
    </div>
  )
}
