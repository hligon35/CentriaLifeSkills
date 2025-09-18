import React from 'react'

interface Props { date: string | Date; mode?: 'datetime' | 'date' | 'time'; className?: string }

export function DateStamp({ date, mode='datetime', className='' }: Props) {
  const d = typeof date === 'string' ? new Date(date) : date
  const iso = d.toISOString()
  let text: string
  if (mode === 'date') text = d.toLocaleDateString()
  else if (mode === 'time') text = d.toLocaleTimeString()
  else text = d.toLocaleString()
  return <time dateTime={iso} className={className}>{text}</time>
}
