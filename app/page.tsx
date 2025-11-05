"use client"
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { TimeAgo } from '@/components/TimeAgo'
import { useSessionContext } from '@/lib/useSessionContext'

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
  const { user, settings } = useSessionContext()
  const role = user?.role || null
  const [allowLikes, setAllowLikes] = useState(true)
  const [allowComments, setAllowComments] = useState(true)
  const [richPreviewEnabled, setRichPreviewEnabled] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [liking, setLiking] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  // category removed
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [flash, setFlash] = useState('')
  const urlRegex = /(https?:\/\/[^\s]+)$/im

  async function handleUpload(file: File) {
    try {
      setUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
      const j = await res.json().catch(()=>null)
      if (!res.ok || !j?.url) throw new Error(j?.error || 'Upload failed')
      setImageUrl(j.url)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    if (!settings) return
    setAllowLikes(Boolean(settings['board.allowLikes']))
    setAllowComments(Boolean(settings['board.allowComments']))
    setRichPreviewEnabled(Boolean(settings['board.richPreview.enabled']))
    setCategories(Array.isArray(settings['board.categories']) ? settings['board.categories'] : [])
  }, [settings])

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
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim() || undefined,
          // category removed
        })
      })
      if (res.ok) {
        const p = await res.json()
        // Ensure shape matches feed expectations
        setPosts(prev => [{ ...p, comments: [], likes: [] }, ...prev])
        setTitle('')
        setBody('')
  // category cleared (removed)
        setImageUrl('')
        if (p && p.published === false) {
          setFlash('Your post was submitted for approval and will appear once approved.')
          setTimeout(() => setFlash(''), 6000)
        }
      }
    } finally {
      setCreating(false)
    }
  }

  const HeaderSection = (
    <div className="mb-4 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-center sm:text-left">
          {/* Insert logo and school name here */}
          <div className="text-2xl font-semibold">BuddyBoard</div>
          <p className="text-xs text-gray-500">Care Starts with Communication.</p>
        </div>
        <input aria-label="Search posts" value={searchInput} onChange={e => setSearchInput(e.target.value)} className="rounded border px-3 py-2 w-full sm:w-64" placeholder="Search posts" />
    </div>
  )

  return (
  <main className="mx-auto max-w-3xl p-4">
      {/* Admin therapist status appears above header */}
      {role === 'ADMIN' && <AdminTherapistStatus />}
      {HeaderSection}

  {/* Create a new post */}
      {flash && (
        <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm">{flash}</div>
      )}
      <div className="mb-6 rounded border bg-white p-4">
        <input
          className="mb-2 w-full rounded border px-3 py-2"
          placeholder="Post title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        {/* category select removed */}
        <textarea
          className="mb-2 w-full rounded border px-3 py-2"
          placeholder="Share updates (avoid PHI in examples)"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            className="min-w-0 flex-1 rounded border px-3 py-2"
            placeholder="Optional image URL (https://...)"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
          />
          {role === 'ADMIN' && (
            <>
              <input id="post-media" type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (f) handleUpload(f)
              }} />
              <label htmlFor="post-media" className="rounded border px-3 py-2 cursor-pointer text-sm">
                {uploading ? 'Uploading…' : 'Add image'}
              </label>
            </>
          )}
        </div>
        {imageUrl && (
          <div className="mb-2">
            <SignedImage url={imageUrl} className="max-h-48 w-auto rounded border" />
          </div>
        )}
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
              <span className="text-xs text-gray-500"><TimeAgo date={p.createdAt} /></span>
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{p.body}</div>
            {/* Rich link preview for the first URL in body */}
            {richPreviewEnabled && <PostLinkPreview body={p.body} />}
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
            {(allowLikes || allowComments) && (
              <div className="mt-3 flex items-center gap-4 text-sm">
                {allowLikes && (
                  <button aria-label="Toggle like" disabled={liking === p.id} onClick={() => toggleLike(p.id)} className="rounded border px-3 py-1">👍 Like ({p.likes?.length || 0})</button>
                )}
                {allowComments && (
                  <span className="text-gray-500">{p.comments.length} comments</span>
                )}
              </div>
            )}
            {!allowLikes && (
              <div className="mt-1 text-[11px] text-gray-500">Likes are disabled by admin.</div>
            )}
            {allowComments && (
              <CommentBox postId={p.id} onAdded={(c) => setPosts(prev => prev.map(x => x.id === p.id ? { ...x, comments: [...x.comments, c] } : x))} />
            )}
            {!allowComments && (
              <div className="mt-1 text-[11px] text-gray-500">Comments are disabled by admin.</div>
            )}
          </article>
        ))}
      </div>

  {/* Insert privacy policy link here for GDPR/FERPA */}
      {/* Emergency contact protocols comment: Insert emergency contact info location here */}
    </main>
  )
}

function parseS3(u: string) {
  if (!u?.startsWith('s3://')) return null
  const rest = u.slice(5)
  const idx = rest.indexOf('/')
  if (idx === -1) return null
  return { bucket: rest.slice(0, idx), key: rest.slice(idx + 1) }
}

function SignedImage({ url, className }: { url: string; className?: string }) {
  const [signed, setSigned] = useState<string | null>(null)
  useEffect(() => {
    const s3 = parseS3(url)
    if (!s3) { setSigned(url); return }
    fetch('/api/media/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: s3.key }) })
      .then(r => r.json()).then(d => setSigned(d.url)).catch(()=>setSigned(null))
  }, [url])
  if (!signed) return <div className="text-xs text-gray-500">Loading image…</div>
  return <Image width={600} height={400} src={signed} alt="preview" className={className || ''} />
}

function firstUrlInText(text: string): string | null {
  if (!text) return null
  const m = text.match(/https?:\/\/[^\s]+/i)
  return m ? m[0] : null
}

function PostLinkPreview({ body }: { body: string }) {
  const url = firstUrlInText(body)
  const [data, setData] = useState<{ title?: string; description?: string; image?: string; siteName?: string } | null>(null)
  useEffect(() => {
    if (!url) { setData(null); return }
    let cancelled = false
    fetch(`/api/link/preview?url=${encodeURIComponent(url)}`)
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (!cancelled) setData(j) })
      .catch(()=>{ if (!cancelled) setData(null) })
    return () => { cancelled = true }
  }, [url])
  if (!url || !data) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded border hover:bg-gray-50">
      <div className="flex gap-3 p-3">
        {data.image && (
          <Image src={data.image} alt={data.title || 'preview'} width={112} height={80} className="h-20 w-28 rounded object-cover border" />
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium line-clamp-1">{data.title || url}</div>
          {data.siteName && <div className="text-[11px] text-gray-500">{data.siteName}</div>}
          {data.description && <div className="text-xs text-gray-600 line-clamp-2">{data.description}</div>}
        </div>
      </div>
    </a>
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
