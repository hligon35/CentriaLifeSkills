"use client"
import { useEffect, useState, useRef } from 'react'

// Separate localStorage key for parent draft
const LS_PARENT_PROFILE_KEY = 'parent:profileDraft:v1'

interface ParentProfileDraft {
  name: string
  displayName: string
  timezone: string
  email: string
  notifyMessageEmail: boolean
  notifyDailySummary: boolean
  photoFile?: File | null
  uploading?: boolean
  photoUrl?: string | null
}

function baseDraft(): ParentProfileDraft {
  return { name:'', displayName:'', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', email:'', notifyMessageEmail:true, notifyDailySummary:false, photoFile:null, uploading:false, photoUrl:null }
}

function loadDraft(): ParentProfileDraft {
  if (typeof localStorage === 'undefined') return baseDraft()
  try {
    const raw = localStorage.getItem(LS_PARENT_PROFILE_KEY)
    if (!raw) return baseDraft()
    const d = JSON.parse(raw)
    return { ...baseDraft(), ...d }
  } catch { return baseDraft() }
}

export default function ParentSettingsPage() {
  const [draft, setDraft] = useState<ParentProfileDraft>(() => loadDraft())
  const [status, setStatus] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(()=>{ try { const { photoFile, uploading, ...persist } = draft; localStorage.setItem(LS_PARENT_PROFILE_KEY, JSON.stringify(persist)) } catch {} }, [draft])

  async function saveProfile() {
    setStatus('Saving…')
    await new Promise(r=>setTimeout(r, 600))
    setStatus('Saved (local only — backend not implemented)')
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setDraft(d=>({ ...d, photoFile:f, uploading:true }))
    try {
      const form = new FormData()
      form.append('file', f)
      const res = await fetch('/api/media/upload', { method:'POST', body:form })
      if (res.ok) {
        const j = await res.json()
        setDraft(d=>({ ...d, photoUrl:j.url, uploading:false }))
        setStatus('Photo uploaded (not yet persisted to server record).')
      } else {
        setDraft(d=>({ ...d, uploading:false }))
        setStatus('Photo upload failed')
      }
    } catch {
      setDraft(d=>({ ...d, uploading:false }))
      setStatus('Photo upload error')
    }
  }

  let timezones: string[] = [draft.timezone]
  try { if (typeof (Intl as any).supportedValuesOf === 'function') { timezones = (Intl as any).supportedValuesOf('timeZone') as string[] } } catch {}

  return (
    <main className="mx-auto max-w-3xl p-2 sm:p-4 space-y-8">
      <header>
        <h1 className="text-xl font-semibold">Profile Settings</h1>
        <p className="text-xs text-gray-600 mt-1">Update your personal information and notification preferences.</p>
      </header>

      <section className="rounded border bg-white p-4 space-y-4">
        <h2 className="font-medium">Basic Info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm space-y-1">
            <span className="font-medium">Full name</span>
            <input value={draft.name} onChange={e=>setDraft(d=>({...d, name:e.target.value}))} placeholder="Your full legal name" className="w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">Display name</span>
            <input value={draft.displayName} onChange={e=>setDraft(d=>({...d, displayName:e.target.value}))} placeholder="Name shown to others" className="w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-sm space-y-1 sm:col-span-2">
            <span className="font-medium">Email</span>
            <input type="email" value={draft.email} onChange={e=>setDraft(d=>({...d, email:e.target.value}))} placeholder="you@example.com" className="w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-sm space-y-1 sm:col-span-2">
            <span className="font-medium">Timezone</span>
            <select value={draft.timezone} onChange={e=>setDraft(d=>({...d, timezone:e.target.value}))} className="w-full rounded border px-3 py-2 text-sm h-10">
              {timezones.map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded border bg-white p-4 space-y-4">
        <h2 className="font-medium">Profile Photo</h2>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden">
            {draft.photoUrl ? <img src={draft.photoUrl} alt="profile" className="object-cover h-full w-full" /> : <span className="text-xs text-gray-500">No photo</span>}
          </div>
          <div className="space-y-2 text-xs text-gray-600">
            <div>Upload a new photo (JPG/PNG).</div>
            <div className="flex items-center gap-2">
              <input ref={fileRef} onChange={handlePhoto} type="file" accept="image/*" className="hidden" />
              <button type="button" className="rounded border px-3 py-1 text-sm" onClick={()=>fileRef.current?.click()} disabled={draft.uploading}>{draft.uploading ? 'Uploading…' : 'Choose file'}</button>
              {draft.photoUrl && <button type="button" className="rounded border px-3 py-1 text-sm" onClick={()=>setDraft(d=>({...d, photoUrl:null}))}>Remove</button>}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded border bg-white p-4 space-y-4">
        <h2 className="font-medium">Notifications</h2>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={draft.notifyMessageEmail} onChange={e=>setDraft(d=>({...d, notifyMessageEmail:e.target.checked}))} />
          <span>
            <span className="font-medium">Email me about new direct messages</span>
            <span className="block text-gray-600 text-xs">Sent at most every 10 minutes while you are offline (future feature).</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={draft.notifyDailySummary} onChange={e=>setDraft(d=>({...d, notifyDailySummary:e.target.checked}))} />
          <span>
            <span className="font-medium">Daily summary email</span>
            <span className="block text-gray-600 text-xs">Digest of updates and unread message counts (future feature).</span>
          </span>
        </label>
      </section>

      <section className="rounded border bg-white p-4 space-y-4">
        <h2 className="font-medium">Danger Zone</h2>
        <div className="text-xs text-gray-600">These actions are local placeholders until backend endpoints exist.</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded border px-3 py-1 text-sm" onClick={()=>{ localStorage.removeItem(LS_PARENT_PROFILE_KEY); setDraft(loadDraft()); setStatus('Draft reset') }}>Reset draft</button>
          <button type="button" className="rounded border px-3 py-1 text-sm" onClick={()=>{ setDraft(d=>({...d, name:'', displayName:'', email:'' })); setStatus('Cleared fields') }}>Clear fields</button>
        </div>
      </section>

      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-xs text-gray-600">{status}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => {
            try {
              localStorage.removeItem('tour:auto:PARENT');
              localStorage.removeItem('tour:skip:PARENT');
            } catch {}
            fetch('/api/tour/skip?role=PARENT', { method: 'DELETE' }).catch(()=>{})
          }} className="rounded border px-3 py-2 text-sm">Reset tour</button>
          <button type="button" onClick={saveProfile} className="rounded bg-brand-600 text-white px-4 py-2 text-sm" data-tour="settings-save">Save changes</button>
        </div>
      </div>
    </main>
  )
}
