'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { useCallback } from 'react'

type Post = { id: string; title: string; body: string; imageUrl?: string; createdAt: string; category?: string | null; tags?: string | null; pinned?: boolean; comments: { id: string; body: string; createdAt: string }[] }

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [reply, setReply] = useState<Record<string, string>>({})
  const [category, setCategory] = useState<string>('')
  const [tag, setTag] = useState<string>('')
  const [role, setRole] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState<string>('')
  const [newTags, setNewTags] = useState<string>('')
  const [newPinned, setNewPinned] = useState<boolean>(false)

  useEffect(() => { fetch('/api/auth/me').then(r => r.json()).then(j => setRole(j?.user?.role || null)).catch(() => setRole(null)) }, [])
  const fetchPosts = useCallback(async () => {
    const q = new URLSearchParams()
    if (category) q.set('category', category)
    if (tag) q.set('tag', tag)
    const res = await fetch(`/api/board${q.toString() ? ('?'+q.toString()) : ''}`)
    if (res.ok) setPosts(await res.json())
  }, [category, tag])
  useEffect(() => { fetchPosts() }, [fetchPosts])

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
    const res = await fetch('/api/board', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      setTitle(''); setBody(''); setNewCategory(''); setNewTags(''); setNewPinned(false)
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
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-sm">Category<br/>
          <select className="rounded border px-2 py-1" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All</option>
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="EVENT">Event</option>
            <option value="NEWS">News</option>
            <option value="SAFETY">Safety</option>
            <option value="KUDOS">Kudos</option>
          </select>
        </label>
        <label className="text-sm">Tag<br/>
          <input className="rounded border px-2 py-1" placeholder="e.g. supplies" value={tag} onChange={e => setTag(e.target.value)} />
        </label>
      </div>
      <div className="mb-6 rounded border bg-white p-3 sm:p-4">
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Post title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="mb-2 w-full rounded border px-3 py-2" placeholder="Share updates (no PHI in examples)" value={body} onChange={e => setBody(e.target.value)} />
        <div className="mb-2 flex flex-wrap items-end gap-2">
          <label className="text-sm">Category<br/>
            <select className="rounded border px-2 py-1" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
              <option value="">None</option>
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="EVENT">Event</option>
              <option value="NEWS">News</option>
              <option value="SAFETY">Safety</option>
              <option value="KUDOS">Kudos</option>
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
      {p.imageUrl && (
              <div className="mt-3">
        <Image width={1200} height={800} src={p.imageUrl} alt="Post image" className="max-h-80 w-full rounded object-cover" />
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
              <div className="flex gap-2">
                <input className="flex-1 rounded border px-2 py-1" placeholder="Write a reply" value={reply[p.id] || ''} onChange={e => setReply({ ...reply, [p.id]: e.target.value })} />
                <button onClick={() => addComment(p.id)} className="rounded bg-brand-600 text-white px-3 py-1">Reply</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
