"use client"
import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import profilePng from '@/icons/profile.png'
import { compressImage } from '@/lib/compress'
import { safeAvatar } from '@/lib/media'
import { useMediaUpload } from '@/lib/useMediaUpload'
import { api } from '@/lib/api'
import { TimeAgo } from './TimeAgo'
import { DateStamp } from './DateStamp'

type Message = {
  id: string
  senderId: string
  receiverId: string
  content: string
  mediaUrl?: string | null
  mediaType?: string | null
  createdAt: string
  readAt?: string | null
  sender?: { id: string; name?: string | null; email: string; role: string; photoUrl?: string | null }
  receiver?: { id: string; name?: string | null; email: string; role: string; photoUrl?: string | null }
}

export default function MessagesClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [media, setMedia] = useState<File | null>(null)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [counterpartId, setCounterpartId] = useState<string | undefined>(undefined)
  const [counterparts, setCounterparts] = useState<Array<{ id: string; name: string }>>([])
  const endRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const { upload: uploadMedia, uploading: mediaUploading, error: mediaError } = useMediaUpload({ accept: ['image/'] })

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    const params: Record<string,string> = {}
    if (cursor) params.cursor = cursor
    try {
      const data = await api<{ items: Message[]; nextCursor?: string }>(`/api/messages${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`)
      const items = Array.isArray(data?.items) ? data.items : []
      setMessages(prev => [...prev, ...items])
      setCursor(typeof data?.nextCursor === 'string' ? data.nextCursor : undefined)
    } catch {
      // swallow network/parsing error
    }
    setLoading(false)
    loadingRef.current = false
  }, [cursor])

  useEffect(() => { loadMore() }, [loadMore])

  useEffect(() => {
    async function loadCounterparts() {
      try {
  const js = await api<any>('/api/directory/students')
        const set = new Map<string, string>()
        for (const s of js.students || []) {
          if (s.parent?.id) set.set(s.parent.id, s.parent.name || 'Parent')
          if (s.amTherapist?.id) set.set(s.amTherapist.id, s.amTherapist.name || 'Therapist')
          if (s.pmTherapist?.id) set.set(s.pmTherapist.id, s.pmTherapist.name || 'Therapist')
        }
        const arr = Array.from(set.entries()).map(([id, name]) => ({ id, name }))
        setCounterparts(arr)
        if (arr[0]) setCounterpartId(prev => prev ?? arr[0].id)
      } catch {}
    }
    loadCounterparts()
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!text.trim()) return
    let mediaUrl: string | undefined
    if (media) {
      const isImage = media.type.startsWith('image/')
      const maybeBlob = isImage ? await compressImage(media) : media
      const processed: File = maybeBlob instanceof File ? maybeBlob : new File([maybeBlob], media.name, { type: media.type })
      const res = await uploadMedia(processed)
      if (res?.url) mediaUrl = res.url
    }
    if (!counterpartId) return
    try {
      const m = await api<Message>('/api/messages', { method: 'POST', json: { receiverId: counterpartId, content: text, mediaUrl } })
      setText('')
      setMedia(null)
      setMessages(prev => [m, ...prev])
    } catch {}
  }

  return (
    <main className="mx-auto max-w-2xl p-3 sm:p-4">
      <h1 className="text-xl font-semibold mb-4 text-center sm:text-left flex items-center gap-2 justify-center sm:justify-start">
        <Image src={profilePng} alt="User" width={24} height={24} className="h-6 w-6 rounded-full border bg-gray-200 p-0.5" />
        <span>Messages</span>
      </h1>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <select aria-label="Select recipient" className="rounded border px-2 py-1" value={counterpartId} onChange={e => setCounterpartId(e.target.value)}>
          {counterparts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
  <div className="h-[60vh] overflow-y-auto flex flex-col border rounded bg-white p-2 sm:p-3 space-y-2" aria-live="polite" data-tour="messages-list">
        {messages.map(m => {
          const s = m.sender
          const isParent = (s?.role || s?.email || '').toUpperCase().includes('PARENT')
          const row = isParent ? 'justify-end' : 'justify-start'
          const bubble = isParent ? 'bg-[#0057b8] text-white' : 'bg-[#623394] text-white'
          const avatar = profilePng
          return (
            <div key={m.id} className={`flex ${row}`}>
              {!isParent && (
                <Image width={28} height={28} src={avatar} alt={s?.name || 'avatar'} className="h-7 w-7 rounded-full border self-start mr-2 shrink-0 bg-gray-200 p-0.5" />
              )}
              <div className={`rounded-lg px-3 py-2 max-w-[70%] ${bubble}`}>
                <div className="text-[10px] opacity-80">{s?.name || s?.email} • <TimeAgo date={m.createdAt} /></div>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                {m.mediaUrl && <MediaViewer url={m.mediaUrl} type={m.mediaType || ''} />}
                <div className="mt-1 text-[10px] opacity-80">{m.readAt ? 'Read' : 'Sent'}</div>
              </div>
              {isParent && (
                <Image width={28} height={28} src={avatar} alt={s?.name || 'avatar'} className="h-7 w-7 rounded-full border self-start ml-2 shrink-0 bg-gray-200 p-0.5" />
              )}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
      {cursor && (
        <div className="mt-2 text-center">
          <button onClick={loadMore} className="rounded border px-3 py-1" disabled={loading}>{loading ? 'Loading…' : 'Load older'}</button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input className="min-w-0 flex-1 rounded border px-3 py-2" placeholder="Type a secure message" value={text} onChange={e => setText(e.target.value)} aria-label="Message content" />
        <input type="file" accept="image/*,video/*" className="hidden" id="media" onChange={e => setMedia(e.target.files?.[0] || null)} />
        <label htmlFor="media" className="rounded border px-3 py-2 cursor-pointer text-sm">{mediaUploading ? 'Uploading…' : media ? 'Change' : 'Media'}</label>
        {media && !mediaUploading && <span className="text-xs text-gray-600 max-w-[120px] truncate">{media.name}</span>}
  <button onClick={send} disabled={!text.trim() || mediaUploading} className="rounded bg-brand-600 text-white px-4 py-2 disabled:opacity-60" data-tour="send-button">Send</button>
      </div>
      {mediaError && <div className="mt-2 text-xs text-red-600" role="alert">{mediaError}</div>}
    </main>
  )
}

function parseS3(u: string) {
  if (!u.startsWith('s3://')) return null
  const rest = u.slice(5)
  const idx = rest.indexOf('/')
  if (idx === -1) return null
  return { bucket: rest.slice(0, idx), key: rest.slice(idx + 1) }
}

function MediaViewer({ url, type }: { url: string; type: string }) {
  const [signed, setSigned] = useState<string | null>(null)
  useEffect(() => {
    const s3 = parseS3(url)
    if (!s3) { setSigned(url); return }
    fetch('/api/media/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: s3.key }) })
      .then(r => r.json())
      .then(d => setSigned(d.url))
  }, [url])
  if (!signed) return <div className="text-xs text-gray-500">Loading media…</div>
  if (type.startsWith('video/')) return <video controls className="mt-2 max-h-64" src={signed} />
  return <Image width={600} height={400} className="mt-2 max-h-64 rounded" src={signed} alt="attachment" />
}
