'use client'
import { useEffect, useState, useCallback } from 'react'
import { useMediaUpload } from '@/lib/useMediaUpload'
import Image from 'next/image'
import { TimeAgo } from '@/components/TimeAgo'
import { api, isApiError } from '@/lib/api'
import { useSessionContext } from '@/lib/useSessionContext'

type Post = { id: string; title: string; body: string; imageUrl?: string; fileUrl?: string; createdAt: string; pinned?: boolean; comments: { id: string; body: string; createdAt: string }[] }

export default function BoardClient() {
  const [posts, setPosts] = useState<Post[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const { uploading, upload, error: uploadError, reset: resetUpload } = useMediaUpload({ accept: ['image/'] })
  const [reply, setReply] = useState<Record<string, string>>({})
  // category & tags removed
  const { user, settings } = useSessionContext()
  const role = user?.role || null
  // Removed per request: category & tags inputs in composer
  const [newPinned, setNewPinned] = useState<boolean>(false)
  const [allowComments, setAllowComments] = useState(true)
  const [richPreviewEnabled, setRichPreviewEnabled] = useState(true)
  // categories removed
  const [flash, setFlash] = useState('')

  useEffect(() => {
    if (!settings) return
    setAllowComments(Boolean(settings['board.allowComments']))
    setRichPreviewEnabled(Boolean(settings['board.richPreview.enabled']))
  }, [settings])

  const fetchPosts = useCallback(async () => {
    try {
      const data = await api<Post[]>('/api/board')
      setPosts(Array.isArray(data) ? data : [])
    } catch {}
  }, [])
  useEffect(() => { fetchPosts() }, [fetchPosts])

  async function handleUpload(file: File) {
    const res = await upload(file)
    if (res?.url) setImageUrl(res.url)
  }

  async function createPost() {
    const payload: any = { title, body }
    if (role === 'ADMIN') payload.pinned = newPinned
    if (imageUrl.trim()) payload.imageUrl = imageUrl.trim()
    try {
      const created = await api<any>('/api/board', { method: 'POST', json: payload })
      setTitle(''); setBody(''); setImageUrl(''); setNewPinned(false)
      if (created && created.published === false) {
        setFlash('Your post was submitted for approval and will appear once approved.')
        setTimeout(() => setFlash(''), 6000)
      }
      await fetchPosts()
    } catch(e) {
      // optional: setFlash((e as any)?.message || 'Failed to create post')
    }
  }

  async function addComment(postId: string) {
    try {
      const c = await api('/api/board/comments', { method: 'POST', json: { postId, body: reply[postId] || '' } })
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, c as any] } : p))
      setReply(r => ({ ...r, [postId]: '' }))
    } catch {}
  }

  return (
    <div>
      {flash && (
        <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm">{flash}</div>
      )}
      <div className="mb-2 text-xs uppercase tracking-wide text-gray-500 font-semibold">Create a Post</div>
      {/* category & tag filters removed */}
  <div className="mb-6 rounded border bg-white p-3 sm:p-4" data-tour="board-composer">
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
        {uploadError && <div className="text-xs text-red-600 mb-2">{uploadError}</div>}
        {imageUrl && (
          <div className="mb-2">
            <SignedImage url={imageUrl} className="max-h-48 w-auto rounded border" />
          </div>
        )}
        {role === 'ADMIN' && (
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <label className="text-sm inline-flex items-center gap-2">
              <input type="checkbox" className="rounded border" checked={newPinned} onChange={e => setNewPinned(e.target.checked)} />
              Pin this post
            </label>
          </div>
        )}
  <button onClick={createPost} className="rounded bg-brand-600 text-white px-4 py-2" data-tour="board-post-button">Post</button>
      </div>
      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="rounded border border-dashed p-6 text-center text-sm text-gray-500 bg-white">No posts yet. Be the first to share an update.</div>
        )}
        {posts.map(p => (
          <div key={p.id} className="rounded border bg-white p-3 sm:p-4">
            <div className="font-medium flex items-center gap-2">
              {p.pinned && <span className="inline-block rounded bg-yellow-200 text-yellow-900 text-[10px] px-1.5 py-0.5">Pinned</span>}
              <span>{p.title}</span>
            </div>
            {/* category & tags metadata removed */}
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
              <TimeAgo date={p.createdAt} className="" />
              {role === 'ADMIN' && (
                <button
                  className="rounded border px-2 py-1 text-xs"
                  onClick={async () => {
                    try {
                      await api('/api/board/pin', { method: 'POST', json: { postId: p.id, pinned: !p.pinned } })
                      await fetchPosts()
                    } catch {}
                  }}
                >{p.pinned ? 'Unpin' : 'Pin'}</button>
              )}
            </div>
            <div className="mt-3 border-t pt-3 space-y-2">
              {p.comments.map(c => (
                <div key={c.id} className="text-sm">
                  <div>{c.body}</div>
                  <div className="text-[10px] text-gray-500"><TimeAgo date={c.createdAt} /></div>
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
    </div>
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