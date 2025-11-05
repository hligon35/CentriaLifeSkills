'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function LoginPage() {
  // Show dev shortcuts only in non-production builds, unless explicitly enabled via NEXT_PUBLIC_SHOW_DEV_SSO=1
  const showDev = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_SHOW_DEV_SSO === '1'
  const showTestCreds = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_SHOW_TEST_CREDS === '1'
  const [ssoConfigured, setSsoConfigured] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePasswordLogin() {
    setError(null)
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || 'Login failed')
      return
    }
    const rt = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('returnTo') || '') : ''
    const meResp = await fetch('/api/auth/me')
    const me = await meResp.json().catch(() => null)
    const role = me?.user?.role as 'THERAPIST' | 'PARENT' | 'ADMIN' | undefined
    if (rt) {
      window.location.href = rt
      return
    }
    if (role === 'ADMIN') window.location.href = '/admin'
    else if (role === 'THERAPIST') window.location.href = '/therapist'
    else if (role === 'PARENT') window.location.href = '/parent'
    else window.location.href = '/'
  }

  async function handleSSO() {
    setError(null)
    try {
      const rt = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('returnTo') || '/') : '/'
      const chk = await fetch(`/api/auth/sso/login?check=1`).then(r => r.json())
      if (!chk?.configured) {
        setError('SSO is not configured')
        return
      }
      // Redirect via our API so it encodes returnTo in state
      window.location.href = `/api/auth/sso/login?returnTo=${encodeURIComponent(rt)}`
    } catch {
      setError('SSO failed to start')
    }
  }

  // Probe SSO availability at runtime; in production, hide the button unless SSO is configured.
  useEffect(() => {
    let alive = true
    fetch('/api/auth/sso/login?check=1')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (alive) setSsoConfigured(Boolean(j?.configured)) })
      .catch(() => { if (alive) setSsoConfigured(false) })
    return () => { alive = false }
  }, [])

  const showSSO = (process.env.NODE_ENV !== 'production') ? true : ssoConfigured

  async function handleDevSSO(role: 'THERAPIST' | 'PARENT') {
    try {
      setError(null)
      const res = await fetch('/api/auth/sso/dev', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Dev SSO failed')
        return
      }
      const rt = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('returnTo') || '') : ''
      if (rt) {
        window.location.href = rt
      } else {
        window.location.href = role === 'THERAPIST' ? '/therapist' : '/parent'
      }
    } catch (e) {
      setError('Dev SSO failed to start (network)')
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 min-h-screen flex items-center justify-center">
      <div className="grid gap-6 md:grid-cols-3 items-center w-full">
        {/* Left: Logo (col 1), aligned to the right to sit close to the form */}
        <div className="md:col-start-1 md:col-span-1 flex items-center justify-center md:justify-end">
          <Image
            src="/api/assets/buddyBoard"
            alt="BuddyBoard Logo"
            width={256}
            height={128}
            className="w-48 md:w-64 h-auto object-contain"
            priority
          />
        </div>

  {/* Middle: Login form (col 2) */}
          <div className="md:col-start-2 md:col-span-1 flex justify-center">
          <div className="rounded-lg border bg-white p-4 space-y-2 w-full max-w-sm">
            <h1 className="text-xl font-semibold text-center">Sign in</h1>
            {error && <div className="rounded bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">{error}</div>}
            <form onSubmit={(e) => { e.preventDefault(); handlePasswordLogin(); }} className="space-y-2">
              <input className="w-full rounded border px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />
              <div className="relative">
                <input
                  className="w-full rounded border px-3 py-2 pr-10"
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute inset-y-0 right-2 my-auto h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 focus:outline-none focus-visible:ring"
                >
                {/* Eye icon */}
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 3-3c0-.39-.08-.76-.22-1.09" />
                    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 10.94 7.5-.49 1.24-1.22 2.37-2.13 3.34M6.12 6.12C4.25 7.35 2.76 9.18 2 11.5c1.12 3.15 4 6 10 6 1.44 0 2.77-.2 3.96-.57" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
              <button type="submit" className="w-full rounded-lg bg-brand-600 text-white px-4 py-2">Sign in</button>
            </form>
            {showSSO && <div className="text-center text-xs text-gray-500">or</div>}
            {showSSO && (
              <button onClick={handleSSO} className="w-full rounded-lg border px-4 py-2">Continue with SSO</button>
            )}
            {showDev && (
              <>
                <div className="text-xs text-gray-500">Dev shortcuts</div>
                <div className="flex gap-2">
                  <button onClick={() => handleDevSSO('THERAPIST')} className="flex-1 rounded-lg border px-3 py-2">Dev SSO Therapist</button>
                  <button onClick={() => handleDevSSO('PARENT')} className="flex-1 rounded-lg border px-3 py-2">Dev SSO Parent</button>
                  <button onClick={() => fetch('/api/auth/sso/dev', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'ADMIN' }) }).then(res => { if (res.ok) { const rt = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('returnTo') || '/admin') : '/admin'; window.location.href = rt } })} className="hidden sm:block flex-1 rounded-lg border px-3 py-2">Dev SSO Admin</button>
                </div>
              </>
            )}
            {showTestCreds && (
              <p className="mt-3 text-xs text-gray-500">Test users: therapist@example.com / parent@example.com / admin@example.com with Password123!</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Need an account? <a href="/register" className="underline">Register</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}
