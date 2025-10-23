"use client"
import React, { useEffect, useState } from 'react'

type Item = { id: number; title: string; user: string }

export default function ModerationDemo() {
  const [items, setItems] = useState<Item[]>([])
  const [approved, setApproved] = useState<number[]>([])
  const [rejected, setRejected] = useState<number[]>([])

  useEffect(() => {
    const base: Item[] = [
      { id: 1, title: 'Field trip photos', user: 'Parent A' },
      { id: 2, title: 'Therapy tips', user: 'Therapist B' },
      { id: 3, title: 'After school club', user: 'Parent C' },
    ]
    let i = 0
    const t = setInterval(() => {
      setItems(prev => (i < base.length ? [...prev, base[i]] : prev))
      i++
      if (i >= base.length) clearInterval(t)
    }, 500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-2">
      {items.map(it => (
        <div key={it.id} className="rounded border bg-white p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{it.title}</div>
            <div className="text-xs text-gray-500">Submitted by {it.user}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setApproved(a => [...a, it.id])}
              disabled={approved.includes(it.id) || rejected.includes(it.id)}
              className="rounded border px-2 py-1 text-xs text-green-700 border-green-300 bg-green-50 disabled:opacity-60"
            >{approved.includes(it.id) ? 'Approved' : 'Approve'}</button>
            <button
              onClick={() => setRejected(r => [...r, it.id])}
              disabled={approved.includes(it.id) || rejected.includes(it.id)}
              className="rounded border px-2 py-1 text-xs text-red-700 border-red-300 bg-red-50 disabled:opacity-60"
            >{rejected.includes(it.id) ? 'Rejected' : 'Reject'}</button>
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="text-xs text-gray-500">Loading pending posts…</div>}
    </div>
  )
}
