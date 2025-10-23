"use client"
import React, { useEffect, useState } from 'react'

export default function SettingsDemo() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!saving) return
    const t = setTimeout(() => {
      setSaving(false)
      setSaved(true)
      const t2 = setTimeout(() => setSaved(false), 1200)
      return () => clearTimeout(t2)
    }, 900)
    return () => clearTimeout(t)
  }, [saving])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-md border bg-white p-3">
        <span className="text-sm">Email notifications</span>
        <span className="h-5 w-10 rounded-full bg-gray-200 relative inline-block">
          <span className="absolute left-0 top-0 h-5 w-5 rounded-full bg-white shadow transition-transform translate-x-0" />
        </span>
      </div>
      <div className="flex items-center justify-between rounded-md border bg-white p-3">
        <span className="text-sm">Dark mode</span>
        <span className="h-5 w-10 rounded-full bg-indigo-500 relative inline-block">
          <span className="absolute left-0 top-0 h-5 w-5 rounded-full bg-white shadow transition-transform translate-x-5" />
        </span>
      </div>
      <button
        onClick={() => setSaving(true)}
        className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      {saved && <div className="text-center text-xs text-green-600">Saved!</div>}
    </div>
  )
}
