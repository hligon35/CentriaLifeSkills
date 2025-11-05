'use client'
import { useState, useEffect } from 'react'

export default function RegisterPage() {
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'THERAPIST' | 'PARENT' | 'ADMIN' | ''>('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [allowOpen, setAllowOpen] = useState(false)

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const t = sp.get('token')
    if (t) setToken(t)
    // Probe open registration by sending a fake request? Better: rely on env injection via global var if ever needed.
    // For now we infer: if no token we show role/email fields; server will reject if not allowed.
    setAllowOpen(true)
  }, [])

  async function submit() {
    setError(null)
    if (password !== confirm) { setError('Passwords do not match'); return }
    const payload: any = { name, password }
    if (token) payload.token = token; else { payload.email = email; payload.role = role }
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Registration failed')
      return
    }
    setSuccess(true)
    // Redirect after slight delay
    setTimeout(() => { window.location.href = '/' }, 600)
  }

  const inviteMode = !!token

  return (
  <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-4">Create your account</h1>
      <div className="rounded border bg-white p-4 space-y-3">
        {error && <div className="rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{error}</div>}
        {success && <div className="rounded bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">Account created! Redirecting...</div>}
        {inviteMode ? (
          <p className="text-xs text-gray-600">Registering with invite token. Email & role locked.</p>
        ) : (
          <>
            <input className="w-full rounded border px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <select aria-label="Role" className="w-full rounded border px-3 py-2" value={role} onChange={e => setRole(e.target.value as any)}>
              <option value="">Select role</option>
              <option value="THERAPIST">Therapist</option>
              <option value="PARENT">Parent</option>
            </select>
          </>
        )}
        <input className="w-full rounded border px-3 py-2" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" placeholder="Confirm password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
        <button onClick={submit} className="w-full rounded bg-brand-600 text-white py-2">Register</button>
        <div className="text-xs text-gray-500">Have an account? <a className="underline" href="/login">Sign in</a></div>
      </div>
    </main>
  )
}
