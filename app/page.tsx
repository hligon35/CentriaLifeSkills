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
  imageUrl?: string
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [search, setSearch] = useState('')
  const [liking, setLiking] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => { refresh() }, [])

  async function refresh() {
  setLoading(true)
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
  } finally { setLoading(false) }
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
  body: JSON.stringify({ title: title.trim(), body: body.trim(), imageUrl: imageUrl.trim() || undefined })
      })
      if (res.ok) {
        const p = await res.json()
        // Ensure shape matches feed expectations
        setPosts(prev => [{ ...p, comments: [], likes: [] }, ...prev])
        setTitle('')
        setBody('')
  setImageUrl('')
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-center sm:text-left">
          {/* Insert logo and school name here */}
          <div className="text-2xl font-semibold">Life Skills</div>
          <p className="text-xs text-gray-500">School-wide updates</p>
        </div>
        <input aria-label="Search posts" value={search} onChange={e => setSearch(e.target.value)} className="rounded border px-3 py-2 w-full sm:w-64" placeholder="Search posts" />
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
        <input
          className="mb-2 w-full rounded border px-3 py-2"
          placeholder="Optional image URL (https://...)"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
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
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse rounded border bg-white p-4">
                <div className="h-4 w-1/3 bg-gray-200 rounded" />
                <div className="mt-2 h-3 w-2/3 bg-gray-100 rounded" />
                <div className="mt-1 h-3 w-5/6 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="rounded border bg-white p-6 text-center text-gray-500">No posts yet. Be the first to share an update.</div>
        )}
        {(Array.isArray(filtered) ? filtered : []).map(p => (
          <article key={p.id} className="rounded border bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-lg">{p.title}</h2>
              <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{p.body}</div>
        {p.imageUrl && (
              <div className="mt-3">
          <img loading="lazy" src={p.imageUrl} alt="Post image" className="max-h-80 w-full rounded object-cover" />
              </div>
            )}
            {/* If you support images in body, sanitize before render. */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <button aria-label="Toggle like" disabled={liking === p.id} onClick={() => toggleLike(p.id)} className="rounded border px-3 py-1">👍 Like ({p.likes?.length || 0})</button>
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
