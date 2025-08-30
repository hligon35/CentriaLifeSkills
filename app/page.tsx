"use client"
import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

type Post = {
  id: string
  title: string
  body: string
  createdAt: string
  comments: { id: string }[]
  likes: { userId: string }[]
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [search, setSearch] = useState('')
  const [liking, setLiking] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { refresh() }, [])

  async function refresh() {
    try {
      const res = await fetch('/api/board')
      if (res.status === 401) {
        // Not logged in → go to login
        window.location.href = '/login'
        return
      }
      const data = await res.json().catch(() => null as unknown)
      if (Array.isArray(data)) {
        setPosts(data as Post[])
      } else {
        // Fallback to empty list if API returned an error page or non-array
        setPosts([])
      }
    } catch {
      setPosts([])
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return posts
    return posts.filter(p => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
  }, [posts, search])

  async function toggleLike(postId: string) {
    setLiking(postId)
    const res = await fetch(`/api/board/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }) })
    if (res.ok) {
      const { likes } = await res.json()
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes } : p))
    }
    setLiking(null)
  }

  async function createPost() {
    if (!title.trim() && !body.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() })
      })
      if (res.ok) {
        const p = await res.json()
        // Ensure shape matches feed expectations
        setPosts(prev => [{ ...p, comments: [], likes: [] }, ...prev])
        setTitle('')
        setBody('')
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          {/* Insert logo and school name here */}
          <div className="text-2xl font-semibold">Life Skills</div>
          <p className="text-xs text-gray-500">School-wide updates</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} className="rounded border px-3 py-2 w-64" placeholder="Search posts" />
      </div>

      {/* Create a new post */}
      <div className="mb-6 rounded border bg-white p-4">
        <input
          className="mb-2 w-full rounded border px-3 py-2"
          placeholder="Post title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="mb-2 w-full rounded border px-3 py-2"
          placeholder="Share updates (avoid PHI in examples)"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <button
          onClick={createPost}
          disabled={creating}
          className="rounded bg-brand-600 text-white px-4 py-2 disabled:opacity-60"
        >
          {creating ? 'Posting…' : 'Post'}
        </button>
      </div>

      <div className="space-y-4">
        {(Array.isArray(filtered) ? filtered : []).map(p => (
          <article key={p.id} className="rounded border bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-lg">{p.title}</h2>
              <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{p.body}</div>
            {/* If you support images in body, sanitize before render. */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <button disabled={liking === p.id} onClick={() => toggleLike(p.id)} className="rounded border px-3 py-1">👍 Like ({p.likes?.length || 0})</button>
              <span className="text-gray-500">{p.comments.length} comments</span>
            </div>
          </article>
        ))}
      </div>

      {/* Insert privacy policy link here for GDPR/FERPA */}
      {/* Emergency contact protocols comment: Insert emergency contact info location here */}
    </main>
  )
}
