"use client"
import { formatDistanceToNow } from 'date-fns'
import { useEffect, useState } from 'react'

interface Props { date: string | Date; addSuffix?: boolean; className?: string; refreshMs?: number }

export function TimeAgo({ date, addSuffix = true, className = '', refreshMs = 60_000 }: Props) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!refreshMs) return
    const id = setInterval(() => setNow(Date.now()), refreshMs)
    return () => clearInterval(id)
  }, [refreshMs])
  const d = typeof date === 'string' ? new Date(date) : date
  return <time dateTime={d.toISOString()} className={className}>{formatDistanceToNow(d, { addSuffix })}</time>
}
