"use client"
import React, { useEffect, useRef, useState } from 'react'

const NAMES = ['Alex', 'Jamie', 'Taylor', 'Riley']
const MESSAGES = [
  'Hi! Quick question about today\'s session.',
  'Absolutely! I\'m here to help.',
  'Can we review the new goal sheet?',
  'Sure thing — I\'ll upload it now.',
  'Thanks so much!'
]

export default function ChatDemo() {
  const [items, setItems] = useState<{ id: number, author: string, text: string }[]>([])
  const nextId = useRef(1)
  useEffect(() => {
    setItems([])
    let i = 0
    const t = setInterval(() => {
      setItems(prev => [...prev, { id: nextId.current++, author: NAMES[i % NAMES.length], text: MESSAGES[i % MESSAGES.length] }])
      i++
      if (i >= MESSAGES.length) clearInterval(t)
    }, 700)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="h-48 overflow-hidden">
      <div className="h-full flex flex-col gap-2">
        {items.map((m, idx) => (
          <div key={m.id} className={`flex ${idx % 2 ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow transition-all duration-300 ${idx % 2 ? 'bg-[#623394] text-white' : 'bg-white border'}`}>
              <div className="text-[10px] opacity-60 mb-0.5">{m.author}</div>
              <div>{m.text}</div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-xs text-gray-500">Loading chat…</div>}
      </div>
    </div>
  )
}
