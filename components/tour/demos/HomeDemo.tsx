"use client"
import React, { useEffect, useState } from 'react'

export default function HomeDemo() {
  const [counts, setCounts] = useState({ alerts: 0, tasks: 0, messages: 0 })
  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      i++
      setCounts({ alerts: Math.min(3, i), tasks: Math.min(5, i + 1), messages: Math.min(7, i + 2) })
      if (i > 7) clearInterval(t)
    }, 300)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Card label="Alerts" value={counts.alerts} />
        <Card label="Tasks" value={counts.tasks} />
        <Card label="Messages" value={counts.messages} />
      </div>
      <div className="rounded-md border bg-white p-3">
        <div className="text-xs text-gray-500 mb-2">Today</div>
        <ul className="space-y-2">
          {['Review IEP goals', 'Confirm pickup time', 'Check attendance'].map((t, idx) => (
            <li key={t} className={`flex items-center gap-2 text-sm transition-all ${idx <= counts.alerts ? 'opacity-100' : 'opacity-40'}`}>
              <span className={`h-3 w-3 rounded-full ${idx <= counts.alerts ? 'bg-[#623394]' : 'bg-gray-300'}`} />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-white p-3 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
