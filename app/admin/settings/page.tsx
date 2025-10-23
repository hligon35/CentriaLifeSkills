'use client'
import { useEffect, useState } from 'react'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState('')
  const [ssoEnabled, setSsoEnabled] = useState(false)
  // Board & Content settings
  const [allowLikes, setAllowLikes] = useState(true)
  const [allowComments, setAllowComments] = useState(true)
  const [richPreview, setRichPreview] = useState(true)
  const [richPreviewDomains, setRichPreviewDomains] = useState('')
  const [autoUnpinDays, setAutoUnpinDays] = useState<number>(0)
  const [moderationRequired, setModerationRequired] = useState(false)
  const [moderationTherapist, setModerationTherapist] = useState(false)
  const [moderationParent, setModerationParent] = useState(false)
  const [categories, setCategories] = useState('ANNOUNCEMENT,EVENT,NEWS,SAFETY,KUDOS')
  const [profanityEnabled, setProfanityEnabled] = useState(false)
  const [profanityBlocklist, setProfanityBlocklist] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((s: Record<string, string>) => {
        setBanner(s['branding.banner'] || '')
        setSsoEnabled((s['auth.sso.enabled'] || 'false') === 'true')
  setAllowLikes((s['board.allowLikes'] || 'true') === 'true')
  setAllowComments((s['board.allowComments'] || 'true') === 'true')
  setRichPreview((s['board.richPreview.enabled'] || 'true') === 'true')
  setRichPreviewDomains(s['board.richPreview.allowedDomains'] || '')
  setAutoUnpinDays(Number(s['board.autoUnpin.days'] || '0') || 0)
  setModerationRequired((s['board.moderation.required'] || 'false') === 'true')
  setModerationTherapist((s['board.moderation.required.therapist'] || 'false') === 'true')
  setModerationParent((s['board.moderation.required.parent'] || 'false') === 'true')
  setCategories(s['board.categories'] || 'ANNOUNCEMENT,EVENT,NEWS,SAFETY,KUDOS')
  setProfanityEnabled((s['board.profanityFilter.enabled'] || 'false') === 'true')
  setProfanityBlocklist(s['board.profanityFilter.blocklist'] || '')
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
        body: JSON.stringify({
          'branding.banner': banner,
          'auth.sso.enabled': String(ssoEnabled),
          'board.allowLikes': String(allowLikes),
          'board.allowComments': String(allowComments),
          'board.richPreview.enabled': String(richPreview),
          'board.richPreview.allowedDomains': richPreviewDomains,
          'board.autoUnpin.days': String(autoUnpinDays || 0),
          'board.moderation.required': String(moderationRequired),
          'board.moderation.required.therapist': String(moderationTherapist),
          'board.moderation.required.parent': String(moderationParent),
          'board.categories': categories,
          'board.profanityFilter.enabled': String(profanityEnabled),
          'board.profanityFilter.blocklist': profanityBlocklist,
        })
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
          <h2 className="font-medium mb-2 text-center sm:text-left">Board & Content</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={allowLikes} onChange={e=>setAllowLikes(e.target.checked)} /> Enable likes</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={allowComments} onChange={e=>setAllowComments(e.target.checked)} /> Enable comments</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={richPreview} onChange={e=>setRichPreview(e.target.checked)} /> Enable rich link previews</label>
            <label className="block">Preview allowlist (domains)
              <input value={richPreviewDomains} onChange={e=>setRichPreviewDomains(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="example.org, nytimes.com" />
            </label>
            <label className="block">Auto-unpin days (0 disables)
              <input type="number" min={0} value={autoUnpinDays} onChange={e=>setAutoUnpinDays(Number(e.target.value)||0)} className="mt-1 w-full rounded border px-3 py-2" />
            </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={moderationRequired} onChange={e=>setModerationRequired(e.target.checked)} /> Require approval (global default)</label>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={moderationTherapist} onChange={e=>setModerationTherapist(e.target.checked)} /> Require approval: Therapist posts</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={moderationParent} onChange={e=>setModerationParent(e.target.checked)} /> Require approval: Parent posts</label>
              </div>
            <label className="block sm:col-span-2">Categories (comma-separated)
              <input value={categories} onChange={e=>setCategories(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" placeholder="ANNOUNCEMENT,EVENT,NEWS,SAFETY,KUDOS" />
            </label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={profanityEnabled} onChange={e=>setProfanityEnabled(e.target.checked)} /> Enable profanity filter</label>
            <label className="block sm:col-span-2">Blocklist (comma-separated)
              <textarea value={profanityBlocklist} onChange={e=>setProfanityBlocklist(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={2} placeholder="word1, word2" />
            </label>
          </div>
        </section>

        <section className="rounded border bg-white p-4">
          <h2 className="font-medium mb-2 text-center sm:text-left">Authentication</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ssoEnabled} onChange={e => setSsoEnabled(e.target.checked)} />
            Enable SSO (OIDC)
          </label>
          <p className="mt-1 text-xs text-gray-500">Requires OIDC env vars; toggle affects login UI.</p>
        </section>

        <div className="flex items-center gap-2">
          <button onClick={() => {
            try {
              localStorage.removeItem('tour:auto:ADMIN');
              localStorage.removeItem('tour:skip:ADMIN');
            } catch {}
            fetch('/api/tour/skip?role=ADMIN', { method: 'DELETE' }).catch(()=>{})
          }} className="rounded border px-3 py-2 text-sm">Reset tour</button>
          <button onClick={save} disabled={saving} className="rounded bg-brand-600 text-white px-4 py-2 disabled:opacity-60" data-tour="settings-save">{saving ? 'Saving…' : 'Save settings'}</button>
        </div>
      </div>
    </main>
  )
}
