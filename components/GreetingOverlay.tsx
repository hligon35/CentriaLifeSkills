"use client"
import { useEffect, useState } from 'react'

type Memo = { id: string; title: string; body: string }

export default function GreetingOverlay() {
  const [open, setOpen] = useState(true)
  const [memos, setMemos] = useState<Memo[]>([])
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/urgent-memos', { cache: 'no-store' })
        if (!r.ok) {
          // Non-OK: treat as no memos
          if (!cancelled) setMemos([])
          return
        }
        // Some environments can return empty body; guard JSON parse
        const text = await r.text()
        const d = text ? JSON.parse(text) : { memos: [] }
        if (!cancelled) setMemos(Array.isArray(d?.memos) ? d.memos : [])
      } catch {
        if (!cancelled) setMemos([])
      }
    })()
    return () => { cancelled = true }
  }, [])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
        <div className="p-4 border-b rounded-t-lg">
          <div className="text-lg font-semibold">Welcome back</div>
          <div className="text-xs text-gray-600">Here are any urgent memos from admin</div>
        </div>
        <div className="p-4 space-y-3 max-h-[50vh] overflow-auto">
          {memos.length === 0 && <div className="text-sm text-gray-600">No urgent memos right now.</div>}
          {memos.map(m => (
            <div key={m.id} className="rounded-lg border p-3">
              <div className="font-medium">{m.title}</div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{m.body}</div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t flex justify-end rounded-b-lg">
          <button
            className="rounded-lg border px-4 py-2"
            onClick={async () => {
              try {
                const ids = memos.map(m => m.id)
                if (ids.length) await fetch('/api/urgent-memos/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memoIds: ids }) })
              } catch {}
              setOpen(false)
            }}
          >Continue</button>
        </div>
      </div>
    </div>
  )
}
