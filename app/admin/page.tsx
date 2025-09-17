"use client"
import { useMemo, useState, useEffect } from 'react'
import AdminMessagesPage from './messages/page'
import AdminCalendarPage from './calendar/page'
import AdminDirectoryPage from './directory/page'
import AdminSettingsPage from './settings/page'
import AdminModerationPage from './moderation/page'
import Home from '../page'

type TabKey = 'home' | 'messages' | 'calendar' | 'directory' | 'settings' | 'moderation'

export default function AdminHomeTabs() {
  const [tab, setTab] = useState<TabKey>('home')

  // Sync with query param ?tab=
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const t = (url.searchParams.get('tab') || '').toLowerCase()
  if (t === 'home' || t === 'messages' || t === 'calendar' || t === 'directory' || t === 'settings' || t === 'moderation') setTab(t as TabKey)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }, [tab])

  const tabs = useMemo(() => ([
    { key: 'home', label: 'Home' },
    { key: 'messages', label: 'Messages' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'directory', label: 'Directory' },
  { key: 'moderation', label: 'Moderation' },
  { key: 'settings', label: 'Settings' },
  ] as Array<{ key: TabKey; label: string }>), [])

  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <div role="tablist" aria-label="Admin sections" className="flex flex-wrap justify-center gap-2 border-b">
          {tabs.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`px-3 py-2 text-sm -mb-[1px] border-b-2 ${tab === t.key ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
              onClick={() => setTab(t.key as TabKey)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" hidden={tab !== 'home'}>
        <Home headerFirst />
      </div>

      {/* Panels */}
      <div role="tabpanel" hidden={tab !== 'messages'}>
        <AdminMessagesPage />
      </div>
      <div role="tabpanel" hidden={tab !== 'calendar'}>
        <AdminCalendarPage />
      </div>
      <div role="tabpanel" hidden={tab !== 'directory'}>
        <AdminDirectoryPage />
      </div>
      <div role="tabpanel" hidden={tab !== 'moderation'}>
        <AdminModerationPage />
      </div>
      <div role="tabpanel" hidden={tab !== 'settings'}>
        <AdminSettingsPage />
      </div>
    </main>
  )
}
