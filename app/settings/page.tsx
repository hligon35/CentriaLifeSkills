'use client'
import { useState } from 'react'

export default function SettingsPage() {
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)
  const [mediaShare, setMediaShare] = useState<'therapist' | 'parents-only' | 'admins-only'>('therapist')
  const [lang, setLang] = useState('en')

  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <div className="space-y-6">
        <section className="rounded border bg-white p-4">
          <div className="font-medium mb-2">Notification Preferences</div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={email} onChange={e => setEmail(e.target.checked)} /> Email</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={sms} onChange={e => setSms(e.target.checked)} /> SMS</label>
        </section>
        <section className="rounded border bg-white p-4">
          <div className="font-medium mb-2">Media Sharing Permissions</div>
          <label className="sr-only" htmlFor="mediaShare">Media Sharing Permissions</label>
          <select id="mediaShare" className="rounded border px-2 py-1" value={mediaShare} onChange={e => setMediaShare(e.target.value as any)}>
            <option value="therapist">Therapist</option>
            <option value="parents-only">Parents Only</option>
            <option value="admins-only">Admins Only</option>
          </select>
        </section>
        <section className="rounded border bg-white p-4">
          <div className="font-medium mb-2">Language</div>
          {/* Insert supported languages */}
          <label className="sr-only" htmlFor="language">Language</label>
          <select id="language" className="rounded border px-2 py-1" value={lang} onChange={e => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </section>
      </div>
    </main>
  )
}
