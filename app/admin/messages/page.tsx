"use client"
import { useEffect, useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import { safeAvatar } from '@/lib/media'

type Student = { id: string; name: string; parent?: Participant; amTherapist?: Participant; pmTherapist?: Participant }
type Message = { id: string; senderId: string; receiverId: string; content: string; createdAt: string }
type Participant = { id: string; name: string; email: string; role?: string; photoUrl?: string }
type StudentContext = { id: string; name: string; parentId: string; amTherapistId: string; pmTherapistId: string }

export default function AdminMessagesPage() {
  // For admin send message panel
  const [sendTo, setSendTo] = useState<string[]>([])
  const [sendType, setSendType] = useState<'all-parents'|'all-therapists'|'custom'|''>('')
  const [sendContent, setSendContent] = useState('')
  const [sendBusy, setSendBusy] = useState(false)
  const [sendStatus, setSendStatus] = useState('')
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  // Gather all parents/therapists for selection (defined after participants state below)
  async function sendMessage() {
    setSendBusy(true); setSendStatus('')
    try {
      let recipientIds: string[] = []
      if (sendType === 'all-parents') recipientIds = allParents.map(p => p.id)
      else if (sendType === 'all-therapists') recipientIds = allTherapists.map(p => p.id)
      else recipientIds = sendTo
      if (!recipientIds.length) throw new Error('No recipients selected')
      await Promise.all(recipientIds.map(rid => fetch('/api/admin/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: rid, content: sendContent })
      })))
      setSendStatus('Message sent!')
      setSendContent(''); setSendTo([]); setSendType('')
    } catch (e: any) { setSendStatus(e.message) } finally { setSendBusy(false) }
  }
  const [students, setStudents] = useState<Student[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null)
  const [sQuery, setSQuery] = useState('')
  const [view, setView] = useState<'ALL'|'AM'|'PM'>('ALL')
  const [replyTo, setReplyTo] = useState<'AM'|'PM'|'PARENT'>('PARENT')
  const [replyBody, setReplyBody] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const [limit, setLimit] = useState(50)

  // Now that participants is declared, derive role-based lists
  const allParents = useMemo(() => participants.filter(p => (p.role || '').toUpperCase() === 'PARENT'), [participants])
  const allTherapists = useMemo(() => participants.filter(p => (p.role || '').toUpperCase() === 'THERAPIST'), [participants])

  useEffect(() => {
    fetch('/api/admin/messages').then(r => r.json()).then(d => setStudents(d.students || []))
  }, [])

  useEffect(() => {
    if (!selected) return
  fetch(`/api/admin/messages?studentId=${selected}`).then(r => r.json()).then(d => { setMessages(d.messages || []); setParticipants(d.participants || []); setStudentCtx(d.student || null) })
  }, [selected])

  // Auto-scroll on message updates
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, view])

  function timeAgo(dateStr: string) {
    const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (s < 60) return `${s}s`
    const m = Math.floor(s/60); if (m < 60) return `${m}m`
    const h = Math.floor(m/60); if (h < 24) return `${h}h`
    const d = Math.floor(h/24); return `${d}d`
  }
  function toCsvRow(cols: string[]) { return cols.map(c => '"'+String(c).replace(/"/g,'""')+'"').join(',') }
  function exportCsv(current: Message[]) {
    const header = toCsvRow(['timestamp','sender','receiver','content'])
    const rows = current.map(m => {
      const s = participants.find(p=>p.id===m.senderId)?.name || m.senderId
      const r = participants.find(p=>p.id===m.receiverId)?.name || m.receiverId
      return toCsvRow([new Date(m.createdAt).toISOString(), s, r, m.content])
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'messages.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  async function sendQuickReply() {
    if (!studentCtx || !replyBody.trim()) return
    const parentId = studentCtx.parentId
    const amId = studentCtx.amTherapistId
    const pmId = studentCtx.pmTherapistId
    let target: string | undefined
    if (replyTo === 'PARENT') target = parentId
    if (replyTo === 'AM') target = amId
    if (replyTo === 'PM') target = pmId
    if (!target) return
    const res = await fetch('/api/admin/messages/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: target, content: replyBody }) })
    if (res.ok) {
      setReplyBody('')
      // Refresh thread
      fetch(`/api/admin/messages?studentId=${selected}`).then(r => r.json()).then(d => { setMessages(d.messages || []); setParticipants(d.participants || []); setStudentCtx(d.student || null) })
    }
  }

  const filteredStudents = useMemo(() => students.filter(s => s.name.toLowerCase().includes(sQuery.toLowerCase())), [students, sQuery])

  return (
    <main className="mx-auto max-w-6xl p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 md:gap-3 gap-3">
      <section className="border bg-white p-3 md:rounded-l-lg md:rounded-r-none rounded-t-lg md:rounded-t-none">
        <div className="flex items-center gap-2 mb-2">
          <div className="font-medium">Students</div>
          <input value={sQuery} onChange={e=>setSQuery(e.target.value)} className="ml-auto w-40 rounded border px-2 py-1 text-sm" placeholder="Search" />
        </div>
        <ul className="space-y-2 max-h-[72vh] overflow-auto pr-1">
          {filteredStudents.map(s => (
            <li key={s.id}>
              <button onClick={() => setSelected(s.id)} className={`w-full text-left px-3 py-2 rounded-lg border flex items-center gap-2 ${selected === s.id ? 'bg-brand-50 border-brand-200' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-1">
                  {s.parent && (
                    <Image
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full border"
                      src={safeAvatar(s.parent.photoUrl)}
                      alt={s.parent.name || 'Parent'}
                    />
                  )}
                  {s.amTherapist && (
                    <Image
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full border"
                      src={safeAvatar(s.amTherapist.photoUrl)}
                      alt={s.amTherapist.name || 'AM Therapist'}
                    />
                  )}
                  {s.pmTherapist && (
                    <Image
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full border"
                      src={safeAvatar(s.pmTherapist.photoUrl)}
                      alt={s.pmTherapist.name || 'PM Therapist'}
                    />
                  )}
                </div>
                <span className="truncate">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="md:col-span-2 border md:border-l-0 bg-white p-3 md:rounded-r-lg md:rounded-l-none rounded-b-lg md:rounded-b-none">
        {/* Collapsible broadcast composer */}
        <div className="mb-3">
          <button className="text-sm text-brand-700 underline" onClick={()=>setBroadcastOpen(v=>!v)}>
            {broadcastOpen ? 'Hide' : 'Show'} Broadcast Composer
          </button>
        </div>
        {broadcastOpen && (
          <div className="mb-4 rounded border pb-4 p-3 bg-gray-50">
            <div className="font-semibold mb-2">Send Message</div>
            <div className="flex gap-2 mb-2 flex-wrap">
          <select value={sendType} onChange={e => setSendType(e.target.value as any)} className="rounded border px-2 py-1 text-sm">
            <option value="">Select recipients</option>
            <option value="all-parents">All Parents</option>
            <option value="all-therapists">All Therapists</option>
            <option value="custom">Choose Users</option>
          </select>
              {sendType === 'custom' && (
                <select multiple value={sendTo} onChange={e => setSendTo(Array.from(e.target.selectedOptions, o => o.value))} className="rounded border px-2 py-1 text-sm min-w-[180px]">
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                  ))}
                </select>
              )}
            </div>
            <textarea className="w-full rounded border px-2 py-2 mb-2" rows={2} placeholder="Type your message..." value={sendContent} onChange={e => setSendContent(e.target.value)} />
            <button className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded" disabled={sendBusy || !sendContent.trim() || (!sendTo.length && sendType !== 'all-parents' && sendType !== 'all-therapists')} onClick={sendMessage}>{sendBusy ? 'Sending…' : 'Send Message'}</button>
            {sendStatus && <div className="mt-2 text-xs text-gray-600">{sendStatus}</div>}
          </div>
        )}

        {/* Selected participants summary and view controls */}
        <div className="flex items-center gap-2 mb-2">
          <div className="font-medium">Threads</div>
          <div className="ml-auto flex gap-1 text-xs">
            <button onClick={()=>setView('ALL')} className={`rounded px-2 py-1 border ${view==='ALL'?'bg-brand-600 text-white':'bg-white'}`}>All</button>
            <button onClick={()=>setView('AM')} className={`rounded px-2 py-1 border ${view==='AM'?'bg-brand-600 text-white':'bg-white'}`}>AM</button>
            <button onClick={()=>setView('PM')} className={`rounded px-2 py-1 border ${view==='PM'?'bg-brand-600 text-white':'bg-white'}`}>PM</button>
          </div>
        </div>

        {/* Participant chips */}
        {studentCtx && (
          <div className="flex flex-wrap gap-2 items-center mb-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-gray-100">Parent: {participants.find(p=>p.id===studentCtx.parentId)?.name || '—'}</span>
            <span className="px-2 py-1 rounded-full bg-gray-100">AM: {participants.find(p=>p.id===studentCtx.amTherapistId)?.name || '—'}</span>
            <span className="px-2 py-1 rounded-full bg-gray-100">PM: {participants.find(p=>p.id===studentCtx.pmTherapistId)?.name || '—'}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <button className="rounded border px-3 py-1 text-sm" onClick={()=>{
            const parentId = studentCtx?.parentId
            const amId = studentCtx?.amTherapistId
            const pmId = studentCtx?.pmTherapistId
            let current: Message[] = []
            if (!parentId) return
            if (view==='ALL') {
              current = messages.filter(m =>
                (amId && ((m.senderId===parentId && m.receiverId===amId) || (m.senderId===amId && m.receiverId===parentId))) ||
                (pmId && ((m.senderId===parentId && m.receiverId===pmId) || (m.senderId===pmId && m.receiverId===parentId)))
              ).sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            } else {
              const tid = view==='AM'? amId : pmId
              current = messages.filter(m => tid && ((m.senderId===parentId && m.receiverId===tid) || (m.senderId===tid && m.receiverId===parentId)))
            }
            exportCsv(current)
          }}>Export CSV</button>
          <div className="ml-auto text-xs text-gray-500">Showing last {limit}</div>
        </div>

        <div ref={listRef} className="space-y-4 max-h-[56vh] overflow-auto pr-1">
          {(() => {
            const parentId = studentCtx?.parentId
            const amId = studentCtx?.amTherapistId
            const pmId = studentCtx?.pmTherapistId
            if (!parentId) return <div className="text-xs text-gray-500">Select a student to view threads.</div>

            if (view === 'ALL') {
              const all = messages.filter(m =>
                (amId && ((m.senderId===parentId && m.receiverId===amId) || (m.senderId===amId && m.receiverId===parentId))) ||
                (pmId && ((m.senderId===parentId && m.receiverId===pmId) || (m.senderId===pmId && m.receiverId===parentId)))
              ).sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        if (all.length === 0) return <div className="text-xs text-gray-500">No messages yet.</div>
        const slice = all.slice(Math.max(0, all.length - limit))
              return (
                <div className="space-y-2">
          {slice.map(m => {
                    const sender = participants.find(p => p.id === m.senderId)
                    const isParent = m.senderId === parentId
                    const rowClasses = isParent ? 'justify-end' : 'justify-start'
                    const bubbleColor = isParent ? 'bg-[#0057b8] text-white' : 'bg-[#623394] text-white'
                    const avatar = profilePng
                    return (
                      <div key={m.id} className={`flex ${rowClasses}`}>
                        {!isParent && (
                          <Image width={28} height={28} src={avatar} alt={sender?.name || 'avatar'} className="h-7 w-7 rounded-full border self-start mr-2 shrink-0 bg-gray-200 p-0.5" />
                        )}
                        <div className={`rounded-lg px-3 py-2 max-w-[70%] ${bubbleColor}`}>
                          <div className="text-[10px] opacity-80">{sender?.name || sender?.email} • {timeAgo(m.createdAt)}</div>
                          <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                        </div>
                        {isParent && (
                          <Image width={28} height={28} src={avatar} alt={sender?.name || 'avatar'} className="h-7 w-7 rounded-full border self-start ml-2 shrink-0 bg-gray-200 p-0.5" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            }

            const slots: Array<'AM'|'PM'> = view === 'AM' ? ['AM'] : ['PM']
            return slots.map(slot => {
              const therapistId = slot === 'AM' ? amId : pmId
              const slotMsgs = messages.filter(m => therapistId && (
                (m.senderId === parentId && m.receiverId === therapistId) ||
                (m.senderId === therapistId && m.receiverId === parentId)
              ))
              const slice = slotMsgs.slice(Math.max(0, slotMsgs.length - limit))
              return (
                <div key={slot}>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{slot} Therapist Thread</div>
                  <div className="space-y-2">
                    {slice.map(m => {
                      const sender = participants.find(p => p.id === m.senderId)
                      const isParent = m.senderId === parentId
                      const rowClasses = isParent ? 'justify-end' : 'justify-start'
                      const bubbleColor = isParent ? 'bg-[#0057b8] text-white' : 'bg-[#623394] text-white'
                      const avatar = profilePng
                      return (
                        <div key={m.id} className={`flex ${rowClasses}`}>
                          {!isParent && (
                            <Image width={28} height={28} src={avatar} alt={sender?.name || 'avatar'} className="h-7 w-7 rounded-full border self-start mr-2 shrink-0 bg-gray-200 p-0.5" />
                          )}
                          <div className={`rounded-lg px-3 py-2 max-w-[70%] ${bubbleColor}`}>
                            <div className="text-[10px] opacity-80">{sender?.name || sender?.email} • {timeAgo(m.createdAt)}</div>
                            <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                          </div>
                          {isParent && (
                            <Image width={28} height={28} src={avatar} alt={sender?.name || 'avatar'} className="h-7 w-7 rounded-full border self-start ml-2 shrink-0 bg-gray-200 p-0.5" />
                          )}
                        </div>
                      )
                    })}
                    {slotMsgs.length === 0 && <div className="text-xs text-gray-500">No messages yet for {slot} thread.</div>}
                  </div>
                </div>
              )
            })
          })()}
        </div>
        <div className="mt-2 flex items-center justify-center">
          <button className="text-sm underline" onClick={()=>setLimit(l=>l+50)}>Load more</button>
        </div>

        {/* Quick reply composer */}
        {studentCtx && (
          <div className="mt-3 flex items-center gap-2">
            <select value={replyTo} onChange={e=>setReplyTo(e.target.value as any)} className="rounded border px-2 py-2 text-sm">
              <option value="PARENT">To Parent</option>
              <option value="AM">To AM Therapist</option>
              <option value="PM">To PM Therapist</option>
            </select>
            <input value={replyBody} onChange={e=>setReplyBody(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); sendQuickReply() } }} className="flex-1 rounded border px-3 py-2" placeholder="Type a quick reply and press Enter" />
            <button onClick={sendQuickReply} className="rounded bg-brand-600 text-white px-4 py-2">Send</button>
          </div>
        )}
      </section>
    </main>
  )
}
