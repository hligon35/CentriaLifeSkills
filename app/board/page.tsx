'use client'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

type Post = { id: string; title: string; body: string; createdAt: string; comments: { id: string; body: string; createdAt: string }[] }

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [reply, setReply] = useState<Record<string, string>>({})

  useEffect(() => { fetch('/api/board').then(r => r.json()).then(setPosts) }, [])

  async function createPost() {
    const res = await fetch('/api/board', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, body }) })
    if (res.ok) { setTitle(''); setBody(''); setPosts([await res.json(), ...posts]) }
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
      <h1 className="text-xl font-semibold mb-4">Message Board</h1>
      <div className="mb-6 rounded border bg-white p-4">
        <input className="mb-2 w-full rounded border px-3 py-2" placeholder="Post title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="mb-2 w-full rounded border px-3 py-2" placeholder="Share updates (no PHI in examples)" value={body} onChange={e => setBody(e.target.value)} />
        <button onClick={createPost} className="rounded bg-brand-600 text-white px-4 py-2">Post</button>
      </div>
      <div className="space-y-4">
        {posts.map(p => (
          <div key={p.id} className="rounded border bg-white p-4">
            <div className="font-medium">{p.title}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{p.body}</div>
            <div className="mt-2 text-xs text-gray-500">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</div>
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
