"use client"
import React, { useEffect, useMemo, useState } from 'react'

type Person = { name: string; role: string }

const NAMES = ['Alex', 'Bri', 'Casey', 'Devon', 'Emery', 'Flynn', 'Gray', 'Hayden', 'Indy', 'Jules']
const ROLES = ['Therapist', 'Parent', 'Admin', 'Student']

export default function DirectoryDemo() {
  const [q, setQ] = useState('')
  const data = useMemo<Person[]>(() => (
    Array.from({ length: 24 }, (_, i) => ({
      name: `${NAMES[i % NAMES.length]} ${String.fromCharCode(65 + (i % 26))}.`,
      role: ROLES[i % ROLES.length],
    }))
  ), [])

  const list = useMemo(() => data.filter(p => `${p.name} ${p.role}`.toLowerCase().includes(q.toLowerCase())), [data, q])

  useEffect(() => {
    // simple type animation to show filtering
    let i = 0
    const sample = 'Dev'
    const t = setInterval(() => {
      setQ(sample.slice(0, i + 1))
      i++
      if (i >= sample.length) clearInterval(t)
    }, 300)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-2">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search directory…" className="w-full rounded-md border px-3 py-2 text-sm" />
      <div className="max-h-44 overflow-auto rounded-md border">
        {list.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between border-b p-2 text-sm last:border-b-0">
            <span className="font-medium text-gray-800">{p.name}</span>
            <span className="text-gray-500">{p.role}</span>
          </div>
        ))}
        {list.length === 0 && <div className="p-3 text-center text-xs text-gray-500">No matches</div>}
      </div>
    </div>
  )
}
