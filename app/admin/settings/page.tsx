'use client'
import { useEffect, useState } from 'react'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState('')
  const [ssoEnabled, setSsoEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((s: Record<string, string>) => {
        setBanner(s['branding.banner'] || '')
        setSsoEnabled((s['auth.sso.enabled'] || 'false') === 'true')
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'branding.banner': banner, 'auth.sso.enabled': String(ssoEnabled) })
      })
      if (!res.ok) throw new Error('Failed to save')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="mx-auto max-w-3xl p-4">Loading…</main>

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-4 text-center sm:text-left">Admin Settings</h1>
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      <div className="space-y-4">
        <section className="rounded border bg-white p-4">
          <h2 className="font-medium mb-2 text-center sm:text-left">Branding</h2>
          <label className="block text-sm mb-1">Banner text</label>
          <input value={banner} onChange={e => setBanner(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="Welcome to Life Skills" />
        </section>

        <section className="rounded border bg-white p-4">
          <h2 className="font-medium mb-2 text-center sm:text-left">Authentication</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ssoEnabled} onChange={e => setSsoEnabled(e.target.checked)} />
            Enable SSO (OIDC)
          </label>
          <p className="mt-1 text-xs text-gray-500">Requires OIDC env vars; toggle affects login UI.</p>
        </section>

        <button onClick={save} disabled={saving} className="rounded bg-brand-600 text-white px-4 py-2 disabled:opacity-60">{saving ? 'Saving…' : 'Save settings'}</button>
      </div>
    </main>
  )
}
