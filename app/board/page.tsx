'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { useCallback } from 'react'

type Post = { id: string; title: string; body: string; imageUrl?: string; fileUrl?: string; createdAt: string; category?: string | null; tags?: string | null; pinned?: boolean; comments: { id: string; body: string; createdAt: string }[] }

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [reply, setReply] = useState<Record<string, string>>({})
  const [category, setCategory] = useState<string>('')
  const [tag, setTag] = useState<string>('')
  const [role, setRole] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState<string>('')
  const [newTags, setNewTags] = useState<string>('')
  const [newPinned, setNewPinned] = useState<boolean>(false)
  const [allowComments, setAllowComments] = useState(true)
  const [richPreviewEnabled, setRichPreviewEnabled] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [flash, setFlash] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(j => setRole(j?.user?.role || null)).catch(() => setRole(null))
    // load public settings
    fetch('/api/settings')
      .then(r=>r.ok ? r.json() : null)
      .then(s => {
        if (!s) return
        setAllowComments(Boolean(s['board.allowComments']))
        setRichPreviewEnabled(Boolean(s['board.richPreview.enabled']))
        setCategories(Array.isArray(s['board.categories']) ? s['board.categories'] : [])
      })
      .catch(()=>{})
  }, [])
  const fetchPosts = useCallback(async () => {
    const q = new URLSearchParams()
    if (category) q.set('category', category)
    if (tag) q.set('tag', tag)
    const res = await fetch(`/api/board${q.toString() ? ('?'+q.toString()) : ''}`)
    if (res.ok) setPosts(await res.json())
  }, [category, tag])
  useEffect(() => { fetchPosts() }, [fetchPosts])

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

  async function createPost() {
    const tagsArray = newTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 10)
    const payload: any = { title, body }
    if (newCategory) payload.category = newCategory
    if (tagsArray.length) payload.tags = tagsArray
    if (role === 'ADMIN') payload.pinned = newPinned
    if (imageUrl.trim()) payload.imageUrl = imageUrl.trim()
    const res = await fetch('/api/board', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      const created = await res.json()
      setTitle(''); setBody(''); setImageUrl(''); setNewCategory(''); setNewTags(''); setNewPinned(false)
      if (created && created.published === false) {
        setFlash('Your post was submitted for approval and will appear once approved.')
        setTimeout(() => setFlash(''), 6000)
      }
      await fetchPosts()
    }
  }

  async function addComment(postId: string) {
    const res = await fetch('/api/board/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, body: reply[postId] || '' }) })
    if (res.ok) {
      const c = await res.json()
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, c] } : p))
      setReply({ ...reply, [postId]: '' })
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
  <h1 className="text-xl font-semibold mb-4 text-center sm:text-left">Message Board</h1>
      {flash && (
        <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm">{flash}</div>
      )}
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">Category<br/>
          <select className="rounded border px-2 py-1" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All</option>
            {(categories.length ? categories : ['ANNOUNCEMENT','EVENT','NEWS','SAFETY','KUDOS']).map(c => (
              <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">Tag<br/>
          <input className="rounded border px-2 py-1" placeholder="e.g. supplies" value={tag} onChange={e => setTag(e.target.value)} />
        </label>
      </div>
      <div className="mb-6 rounded border bg-white p-3 sm:p-4">
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Post title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="mb-2 w-full rounded border px-3 py-2" placeholder="Share updates (no PHI in examples)" value={body} onChange={e => setBody(e.target.value)} />
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input className="min-w-0 flex-1 rounded border px-3 py-2" placeholder="Optional image URL (https://...)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
          {role === 'ADMIN' && (
            <>
              <input id="board-media" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
              <label htmlFor="board-media" className="rounded border px-3 py-2 cursor-pointer text-sm">{uploading ? 'Uploading…' : 'Add image'}</label>
            </>
          )}
        </div>
        {imageUrl && (
          <div className="mb-2">
            <SignedImage url={imageUrl} className="max-h-48 w-auto rounded border" />
          </div>
        )}
        <div className="mb-2 flex flex-wrap items-end gap-2">
          <label className="text-sm">Category<br/>
            <select className="rounded border px-2 py-1" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
              <option value="">None</option>
              {(categories.length ? categories : ['ANNOUNCEMENT','EVENT','NEWS','SAFETY','KUDOS']).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">Tags<br/>
            <input className="rounded border px-2 py-1" placeholder="comma,separated,tags" value={newTags} onChange={e => setNewTags(e.target.value)} />
          </label>
          {role === 'ADMIN' && (
            <label className="text-sm inline-flex items-center gap-2 mb-1">
              <input type="checkbox" className="rounded border" checked={newPinned} onChange={e => setNewPinned(e.target.checked)} />
              Pin on post
            </label>
          )}
        </div>
        <button onClick={createPost} className="rounded bg-brand-600 text-white px-4 py-2">Post</button>
      </div>
      <div className="space-y-4">
        {posts.map(p => (
          <div key={p.id} className="rounded border bg-white p-3 sm:p-4">
            <div className="font-medium flex items-center gap-2">
              {p.pinned && <span className="inline-block rounded bg-yellow-200 text-yellow-900 text-[10px] px-1.5 py-0.5">Pinned</span>}
              <span>{p.title}</span>
            </div>
            {(p.category || p.tags) && (
              <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                {p.category && <span className="rounded bg-gray-100 px-1.5 py-0.5">{p.category}</span>}
                {p.tags && p.tags.split(',').filter(Boolean).slice(0,3).map(t => <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5">#{t.trim()}</span>)}
              </div>
            )}
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{p.body}</div>
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
            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
              <span>{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
              {role === 'ADMIN' && (
                <button
                  className="rounded border px-2 py-1 text-xs"
                  onClick={async () => {
                    const res = await fetch('/api/board/pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: p.id, pinned: !p.pinned }) })
                    if (res.ok) await fetchPosts()
                  }}
                >{p.pinned ? 'Unpin' : 'Pin'}</button>
              )}
            </div>
            <div className="mt-3 border-t pt-3 space-y-2">
              {p.comments.map(c => (
                <div key={c.id} className="text-sm">
                  <div>{c.body}</div>
                  <div className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</div>
                </div>
              ))}
              {allowComments ? (
                <div className="flex gap-2">
                  <input className="flex-1 rounded border px-2 py-1" placeholder="Write a reply" value={reply[p.id] || ''} onChange={e => setReply({ ...reply, [p.id]: e.target.value })} />
                  <button onClick={() => addComment(p.id)} className="rounded bg-brand-600 text-white px-3 py-1">Reply</button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Comments are disabled.</div>
              )}
            </div>
          </div>
        ))}
      </div>
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
