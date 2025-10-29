"use client"
import React, { useEffect, useMemo, useState } from 'react'

type Appt = { time: string; who: string }

export default function ScheduleDemo() {
  const base: Appt[] = useMemo(() => [
    { time: '9:00 AM', who: 'Student A' },
    { time: '11:00 AM', who: 'Student B' },
    { time: '2:00 PM', who: 'Team Meeting' },
  ], [])
  const [items, setItems] = useState<Appt[]>([])
  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      setItems(prev => [...prev, base[i]])
      i++
      if (i >= base.length) clearInterval(t)
    }, 500)
    return () => clearInterval(t)
  }, [base])

  return (
    <div className="space-y-2">
      {items.map((a, idx) => (
        <div key={idx} className="flex items-center justify-between rounded-md border bg-white p-3 shadow-sm">
          <div className="text-sm font-medium">{a.time}</div>
          <div className="text-sm text-gray-700">{a.who}</div>
        </div>
      ))}
      {items.length === 0 && <div className="text-xs text-gray-500">Building your day…</div>}
    </div>
  )
}
