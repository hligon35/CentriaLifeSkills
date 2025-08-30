'use client'
import { useEffect, useState } from 'react'

type Settings = Record<string, string>

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(j => setSettings(j.settings || {}))
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setSaving(false)
  }

  function set(key: string, val: string) {
    setSettings(s => ({ ...s, [key]: val }))
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-4">Admin Settings</h1>
      <div className="space-y-6">
        <section className="rounded border bg-white p-4">
          <div className="font-medium mb-2">Branding</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <div className="mb-1 text-gray-600">School Name</div>
              <input className="w-full rounded border px-3 py-2" value={settings['brand.name'] || ''} onChange={e => set('brand.name', e.target.value)} />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-gray-600">Primary Color</div>
              <input type="color" className="w-full rounded border px-3 py-2 h-10" value={settings['brand.primary'] || '#623394'} onChange={e => set('brand.primary', e.target.value)} />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-gray-600">Secondary Color</div>
              <input type="color" className="w-full rounded border px-3 py-2 h-10" value={settings['brand.secondary'] || '#0057b8'} onChange={e => set('brand.secondary', e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded border bg-white p-4">
          <div className="font-medium mb-2">Announcement Banner</div>
          <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Banner message (optional)" value={settings['banner.message'] || ''} onChange={e => set('banner.message', e.target.value)} />
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={(settings['banner.enabled'] || 'false') === 'true'} onChange={e => set('banner.enabled', String(e.target.checked))} />
            Enable banner
          </label>
        </section>

        <section className="rounded border bg-white p-4">
          <div className="font-medium mb-2">Authentication</div>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={(settings['auth.sso.enabled'] || 'false') === 'true'} onChange={e => set('auth.sso.enabled', String(e.target.checked))} />
            Enable SSO (requires server env setup)
          </label>
        </section>

        <div className="text-right">
          <button onClick={save} disabled={saving} className="rounded bg-brand-600 text-white px-4 py-2 disabled:opacity-60">{saving ? 'Saving…' : 'Save Settings'}</button>
        </div>
      </div>
    </main>
  )
}
