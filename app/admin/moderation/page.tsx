"use client"
import { useEffect, useState } from 'react'

type PendingPost = {
  id: string
  title: string
  body: string
  imageUrl?: string | null
  category?: string | null
  createdAt: string
  author?: { id: string; name?: string | null; email: string }
}

export default function AdminModerationPage() {
  const [posts, setPosts] = useState<PendingPost[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState('')
  const [author, setAuthor] = useState('')

  async function refresh(nextPage = page) {
    const q = new URLSearchParams()
    q.set('page', String(nextPage))
    q.set('pageSize', String(pageSize))
    if (category) q.set('category', category)
    if (author) q.set('author', author)
    const r = await fetch(`/api/admin/moderation/pending?${q.toString()}`)
    if (r.ok) {
      const j = await r.json()
      setPosts(j.posts || [])
      setTotal(j.total || 0)
      setPage(j.page || nextPage)
    }
  }

  useEffect(() => { refresh(1) }, [category, author, pageSize])

  async function approve(id: string) {
    setBusyId(id)
    const r = await fetch('/api/admin/moderation/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: id }) })
    setBusyId(null)
    if (!r.ok) { setStatus('Approve failed'); return }
    setStatus('Approved')
    refresh()
  }
  async function reject(id: string) {
    setBusyId(id)
    const r = await fetch('/api/admin/moderation/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: id }) })
    setBusyId(null)
    if (!r.ok) { setStatus('Reject failed'); return }
    setStatus('Rejected')
    refresh()
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <section className="max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-3">Pending approvals</h2>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="text-sm">Category<br/>
          <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="e.g. ANNOUNCEMENT" className="rounded border px-2 py-1" />
        </label>
        <label className="text-sm">Author ID<br/>
          <input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="user id" className="rounded border px-2 py-1" />
        </label>
        <label className="text-sm">Per page<br/>
          <select value={pageSize} onChange={e=>setPageSize(Number(e.target.value))} className="rounded border px-2 py-1">
            {[10,20,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button className="rounded border px-3 py-1 text-sm" onClick={()=>refresh(1)}>Apply</button>
        <div className="text-sm text-gray-600">{status}</div>
      </div>
      <ul className="space-y-3">
        {posts.map(p => (
          <li key={p.id} className="rounded border bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-xs text-gray-600">By: {p.author?.name || p.author?.email || 'Unknown'}{p.category ? ` • ${p.category}` : ''}</div>
            <div className="mt-2 text-sm whitespace-pre-wrap">{p.body}</div>
            {p.imageUrl && (
              <img src={p.imageUrl} alt="post" className="mt-2 max-h-60 rounded border object-cover" />
            )}
            <div className="mt-3 flex gap-2">
              <button className="rounded border px-3 py-1 text-sm" disabled={busyId===p.id} onClick={()=>approve(p.id)}>{busyId===p.id ? 'Working…' : 'Approve'}</button>
              <button className="rounded border px-3 py-1 text-sm" disabled={busyId===p.id} onClick={()=>reject(p.id)}>Reject</button>
            </div>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="text-sm text-gray-600">No pending posts.</li>
        )}
      </ul>
      <div className="mt-3 flex items-center justify-between text-sm">
        <button disabled={page<=1} className="rounded border px-3 py-1" onClick={()=>{ const np = Math.max(1, page-1); setPage(np); refresh(np) }}>Prev</button>
        <span>Page {page} of {totalPages} · {total} total</span>
        <button disabled={page>=totalPages} className="rounded border px-3 py-1" onClick={()=>{ const np = Math.min(totalPages, page+1); setPage(np); refresh(np) }}>Next</button>
      </div>
    </section>
  )
}
