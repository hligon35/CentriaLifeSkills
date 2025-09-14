"use client"
import { useEffect, useState } from 'react'

type Me = { id: string; email: string; name: string | null; language: string | null; role: 'THERAPIST' | 'PARENT' | 'ADMIN' }

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Profile form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [language, setLanguage] = useState('en')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/me/profile').then(r => r.json()).then(d => {
      if (d.user) {
        setMe(d.user)
        setName(d.user.name || '')
        setEmail(d.user.email || '')
        setLanguage(d.user.language || 'en')
      }
    }).catch(e => setError(String(e))).finally(() => setLoading(false))
  }, [])

  async function saveProfile() {
    if (!me) return
    setBusy(true); setMsg(''); setError(null)
    try {
      if (me.role === 'PARENT') {
        const res = await fetch('/api/me/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, language }) })
        const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Failed to save')
        setMsg('Profile updated')
      } else if (me.role === 'THERAPIST') {
        const res = await fetch('/api/profile-change-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, language }) })
        const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Failed to submit request')
        setMsg('Change request submitted for review')
      }
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }

  async function changePassword() {
    setBusy(true); setMsg(''); setError(null)
    try {
      const res = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Failed to change password')
      setMsg('Password changed')
      setCurrentPassword(''); setNewPassword('')
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }

  if (loading) return <main className="mx-auto max-w-xl p-4">Loading…</main>

  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      {msg && <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">{msg}</div>}
      <div className="space-y-6">
        <section className="rounded border bg-white p-4">
          <div className="font-medium mb-2">Your Profile</div>
          <div className="grid gap-2">
            <label className="text-sm">Name
              <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <label className="text-sm">Email
              <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <label className="text-sm">Language
              <select className="mt-1 w-full rounded border px-2 py-2" value={language} onChange={e => setLanguage(e.target.value)} disabled={false}>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </label>
            <div className="text-xs text-gray-600">{me?.role === 'THERAPIST' ? 'Saving will submit a change request for admin review.' : 'Saving will update your profile immediately.'}</div>
            <div className="flex gap-2">
              <button onClick={saveProfile} disabled={busy} className="rounded border px-3 py-2 text-sm">{me?.role === 'THERAPIST' ? 'Submit change request' : 'Save profile'}</button>
            </div>
          </div>
        </section>

        <section className="rounded border bg-white p-4">
          <div className="font-medium mb-2">Change Password</div>
          <label className="text-sm">Current Password
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="text-sm mt-2">New Password
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <div className="mt-2">
            <button onClick={changePassword} disabled={busy} className="rounded border px-3 py-2 text-sm">Update password</button>
          </div>
        </section>
      </div>
    </main>
  )
}
