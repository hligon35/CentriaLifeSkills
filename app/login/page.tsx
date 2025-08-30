'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handlePasswordLogin() {
    setError(null)
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Login failed')
      return
    }
    const meResp = await fetch('/api/auth/me')
    const me = await meResp.json().catch(() => null)
    const role = me?.user?.role as 'THERAPIST' | 'PARENT' | 'ADMIN' | undefined
    if (role === 'THERAPIST') window.location.href = '/therapist'
    else if (role === 'PARENT') window.location.href = '/parent'
    else if (role === 'ADMIN') window.location.href = '/admin/messages'
    else window.location.href = '/'
  }

  async function handleSSO() {
    setError(null)
    try {
      const chk = await fetch('/api/auth/sso/login?check=1').then(r => r.json())
      if (!chk?.configured) {
        setError('SSO is not configured')
        return
      }
      window.location.href = chk.url
    } catch {
      setError('SSO failed to start')
    }
  }

  async function handleDevSSO(role: 'THERAPIST' | 'PARENT') {
    const res = await fetch('/api/auth/sso/dev', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    if (res.ok) {
      window.location.href = role === 'THERAPIST' ? '/therapist' : '/parent'
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
  <div className="rounded-lg border bg-white p-4 space-y-2">
  {error && <div className="rounded bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">{error}</div>}
        <input className="w-full rounded border px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
  <button onClick={handlePasswordLogin} className="w-full rounded-lg bg-brand-600 text-white px-4 py-2">Sign in</button>
        <div className="text-center text-xs text-gray-500">or</div>
  <button onClick={handleSSO} className="w-full rounded-lg border px-4 py-2">Continue with SSO</button>
        <div className="text-xs text-gray-500">Dev shortcuts</div>
        <div className="flex gap-2">
          <button onClick={() => handleDevSSO('THERAPIST')} className="flex-1 rounded-lg border px-3 py-2">Dev SSO Therapist</button>
          <button onClick={() => handleDevSSO('PARENT')} className="flex-1 rounded-lg border px-3 py-2">Dev SSO Parent</button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">Test users: therapist@example.com / parent@example.com / admin@example.com with Password123!</p>
    </main>
  )
}
