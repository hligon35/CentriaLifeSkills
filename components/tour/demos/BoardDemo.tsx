"use client"
import React, { useEffect, useRef, useState } from 'react'

const AUTHORS = ['Ms. Carter', 'Mr. Lee', 'Parent: Jordan']
const POSTS = [
  'Reminder: Field trip permission slips due Friday.',
  'Today\'s classroom highlights are posted — check them out!',
  'Thank you to all staff for the extra help this week!'
]

export default function BoardDemo() {
  const [items, setItems] = useState<{ id: number, author: string, text: string }[]>([])
  const nextId = useRef(1)
  useEffect(() => {
    setItems([])
    let i = 0
    const t = setInterval(() => {
      setItems(prev => [{ id: nextId.current++, author: AUTHORS[i % AUTHORS.length], text: POSTS[i % POSTS.length] }, ...prev])
      i++
      if (i >= POSTS.length) clearInterval(t)
    }, 900)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="h-48 overflow-hidden">
      <ul className="space-y-2">
        {items.map(m => (
          <li key={m.id} className="rounded-md bg-white border p-3 shadow-sm">
            <div className="text-[11px] text-gray-500 mb-1">{m.author}</div>
            <div className="text-sm">{m.text}</div>
          </li>
        ))}
        {items.length === 0 && <li className="text-xs text-gray-500">Loading posts…</li>}
      </ul>
    </div>
  )
}
