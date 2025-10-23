"use client"
import React, { useEffect, useState } from 'react'

export default function MyKidDemo() {
  const [progress, setProgress] = useState([10, 25, 5])
  useEffect(() => {
    const t = setInterval(() => {
      setProgress(([a, b, c]) => [Math.min(100, a + 5), Math.min(100, b + 7), Math.min(100, c + 10)])
    }, 300)
    return () => clearInterval(t)
  }, [])

  const goals = ['Requesting help', 'Following directions', 'Sharing and turn-taking']

  return (
    <div className="space-y-3">
      {goals.map((g, i) => (
        <div key={g}>
          <div className="text-sm mb-1">{g}</div>
          <div className="h-3 w-full bg-gray-200 rounded">
            <div className="h-3 rounded bg-[#623394] transition-all" style={{ width: `${progress[i]}%` }} />
          </div>
        </div>
      ))}
      <div className="text-xs text-gray-500">Progress bars fill to show growth over time.</div>
    </div>
  )
}
