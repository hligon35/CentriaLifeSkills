"use client"
import React, { useEffect, useState } from 'react'

type Day = { d: number; has: boolean }

export default function CalendarDemo() {
  const [days, setDays] = useState<Day[]>([])
  useEffect(() => {
    const arr: Day[] = []
    for (let i = 1; i <= 30; i++) arr.push({ d: i, has: Math.random() < 0.25 })
    setDays(arr)
  }, [])

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, idx) => (
        <div key={idx} className={`aspect-square rounded-md border p-1 text-center text-xs ${day.has ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
          <div className="font-medium text-gray-700">{day.d}</div>
          {day.has && <div className="mt-1 h-1.5 rounded bg-indigo-500" />}
        </div>
      ))}
    </div>
  )
}
