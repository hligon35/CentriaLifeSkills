'use client'
import { useEffect, useState } from 'react'

type Item = { id: string; type: string; channel: string; status: string; createdAt: string }

export default function NotificationsPage() {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => { fetch('/api/notifications').then(r => r.json()).then(setItems) }, [])
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-xl font-semibold mb-4">Notifications</h1>
      <ul className="space-y-2">
        {items.map(i => (
          <li key={i.id} className="rounded border bg-white p-3 text-sm flex justify-between">
            <div>{i.type} • {i.channel}</div>
            <div className="text-gray-500">{i.status} • {new Date(i.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
