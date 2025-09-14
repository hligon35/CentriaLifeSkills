"use client"
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

type Post = {
  id: string
  title: string
  body: string
  createdAt: string
  comments: { id: string }[]
  likes: { userId: string }[]
  imageUrl?: string
  fileUrl?: string
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [liking, setLiking] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => { refresh(); fetch('/api/auth/me').then(r=>r.json()).then(j=>setRole(j?.user?.role||null)).catch(()=>setRole(null)) }, [])

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

  // Debounce search input
  useEffect(() => { const id = setTimeout(() => setSearch(searchInput), 250); return () => clearTimeout(id) }, [searchInput])

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
      {role === 'ADMIN' && <AdminTherapistStatus />}
      <div className="mb-4 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-center sm:text-left">
          {/* Insert logo and school name here */}
          <div className="text-2xl font-semibold">Life Skills</div>
          <p className="text-xs text-gray-500">School-wide updates</p>
        </div>
  <input aria-label="Search posts" value={searchInput} onChange={e => setSearchInput(e.target.value)} className="rounded border px-3 py-2 w-full sm:w-64" placeholder="Search posts" />
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
          <article key={p.id} id={`post-${p.id}`} className="rounded border bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-lg">{p.title}</h2>
              <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{p.body}</div>
        {p.imageUrl && (
              <div className="mt-3">
          <Image width={1200} height={800} src={p.imageUrl} alt="Post image" className="max-h-80 w-full rounded object-cover" />
              </div>
            )}
            {p.fileUrl && (
              <div className="mt-2 text-sm">
                <a className="text-brand-600 underline" href={p.fileUrl} target="_blank" rel="noopener noreferrer">View attachment</a>
              </div>
            )}
            {/* If you support images in body, sanitize before render. */}
            <div className="mt-3 flex items-center gap-4 text-sm">
              <button aria-label="Toggle like" disabled={liking === p.id} onClick={() => toggleLike(p.id)} className="rounded border px-3 py-1">👍 Like ({p.likes?.length || 0})</button>
              <span className="text-gray-500">{p.comments.length} comments</span>
            </div>
            <CommentBox postId={p.id} onAdded={(c) => setPosts(prev => prev.map(x => x.id === p.id ? { ...x, comments: [...x.comments, c] } : x))} />
          </article>
        ))}
      </div>

  {/* Insert privacy policy link here for GDPR/FERPA */}
      {/* Emergency contact protocols comment: Insert emergency contact info location here */}
    </main>
  )
}
function AdminTherapistStatus() {
  const [data, setData] = useState<{ scheduled: any[]; clockedIn: any[]; late: any[]; available: any[] } | null>(null)
  useEffect(() => { fetch('/api/admin/shifts/status').then(r=>r.json()).then(setData).catch(()=>setData(null)) }, [])
  if (!data) return null
  return (
    <section className="mb-4 -mx-4 px-4">
      <div className="rounded border bg-white p-2">
        <div className="mb-2 text-sm font-medium">Therapist Status (Today)</div>
        <div className="grid grid-cols-4 gap-2">
          <StatusCard title="Clocked" items={data.clockedIn} getLabel={(x)=>x.therapist?.name || x.therapist?.email || x.therapistId} />
          <StatusCard title="Sched" items={data.scheduled} getLabel={(x)=>x.therapist?.name || x.therapist?.email || x.therapistId} />
          <StatusCard title="Late" items={data.late} getLabel={(x)=>x.therapist?.name || x.therapist?.email || x.therapistId} />
          <StatusCard title="Avail" items={data.available} getLabel={(x)=>x.therapistId} />
        </div>
      </div>
    </section>
  )
}

function StatusCard({ title, items, getLabel }: { title: string; items: any[]; getLabel: (x:any)=>string }) {
  const maxShow = 4
  const names = items.slice(0, maxShow).map(getLabel)
  const more = Math.max(0, items.length - maxShow)
  const toInitials = (s: string) => {
    const parts = s.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    // If looks like an email, use the first two letters of the local part
    const local = s.includes('@') ? s.split('@')[0] : s
    return (local.slice(0,2) || '?').toUpperCase()
  }
  return (
    <div className="rounded border p-2">
      <div className="text-[12px] font-medium mb-1 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-[11px] text-gray-500">{items.length}</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {names.map((n, i) => (
          <span key={i} className="inline-flex items-center justify-center h-6 min-w-6 px-1 rounded bg-gray-100 text-[11px] font-medium">
            {toInitials(String(n))}
          </span>
        ))}
        {more > 0 && (
          <span className="inline-flex items-center justify-center h-6 min-w-6 px-1 rounded bg-gray-200 text-[11px] font-medium">+{more}</span>
        )}
        {items.length === 0 && (
          <span className="text-[11px] text-gray-500">None</span>
        )}
      </div>
    </div>
  )
}

function CommentBox({ postId, onAdded }: { postId: string; onAdded: (c: { id: string }) => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 rounded border px-3 py-2" placeholder="Write a comment" />
        <button disabled={busy || !text.trim()} className="rounded border px-3 py-2" onClick={async () => {
          setBusy(true)
          const res = await fetch('/api/board/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, body: text }) })
          setBusy(false)
          if (res.ok) { const c = await res.json(); onAdded(c); setText('') }
        }}>{busy ? 'Posting…' : 'Comment'}</button>
      </div>
    </div>
  )
}
