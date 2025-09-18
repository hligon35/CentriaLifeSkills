"use client"
import { useCallback, useEffect, useState } from 'react'
import { DateStamp } from '@/components/DateStamp'
import Link from 'next/link'

type SearchResults = {
  posts: { id: string; title: string; createdAt: string }[]
  staff: { id: string; name?: string | null; role?: string }[]
  students: { id: string; name: string }[]
  events: { id: string; title: string; startAt: string }[]
}

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResults>({ posts: [], staff: [], students: [], events: [] })

  const run = useCallback(async () => {
    if (!q.trim()) { setResults({ posts: [], staff: [], students: [], events: [] }); return }
    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    setResults(await r.json())
  }, [q])

  useEffect(() => {
    const id = setTimeout(() => { run() }, 250)
    return () => clearTimeout(id)
  }, [run])

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-3">Search</h1>
      <input className="w-full rounded border px-3 py-2" placeholder="Search posts, people, students, events" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <section>
          <div className="font-medium mb-1">Posts</div>
          <ul className="text-sm space-y-1">
            {results.posts.map(p => (
              <li key={p.id} className="border rounded p-2 bg-white">
                <Link href={`/#post-${p.id}`}>{p.title}</Link>
              </li>
            ))}
            {results.posts.length === 0 && <li className="text-xs text-gray-600">No matches.</li>}
          </ul>
        </section>
        <section>
          <div className="font-medium mb-1">Staff</div>
          <ul className="text-sm space-y-1">
            {results.staff.map(u => (
              <li key={u.id} className="border rounded p-2 bg-white">
                {u.name || u.id} {u.role && <span className="text-xs text-gray-500">· {u.role}</span>}
              </li>
            ))}
            {results.staff.length === 0 && <li className="text-xs text-gray-600">No matches.</li>}
          </ul>
        </section>
        <section>
          <div className="font-medium mb-1">Students</div>
          <ul className="text-sm space-y-1">
            {results.students.map(s => <li key={s.id} className="border rounded p-2 bg-white">{s.name}</li>)}
            {results.students.length === 0 && <li className="text-xs text-gray-600">No matches.</li>}
          </ul>
        </section>
        <section>
          <div className="font-medium mb-1">Events</div>
          <ul className="text-sm space-y-1">
            {results.events.map(e => (
              <li key={e.id} className="border rounded p-2 bg-white">
                {e.title} <span className="text-xs text-gray-500">· <DateStamp date={e.startAt} mode='date' /></span>
              </li>
            ))}
            {results.events.length === 0 && <li className="text-xs text-gray-600">No matches.</li>}
          </ul>
        </section>
      </div>
    </main>
  )
}
