'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

type Student = { id: string; name: string; parent?: Participant; amTherapist?: Participant; pmTherapist?: Participant }
type Message = { id: string; senderId: string; receiverId: string; content: string; createdAt: string }
type Participant = { id: string; name: string; email: string; role?: string; photoUrl?: string }
type StudentContext = { id: string; name: string; parentId: string; amTherapistId: string; pmTherapistId: string }

export default function AdminMessagesPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [studentCtx, setStudentCtx] = useState<StudentContext | null>(null)

  useEffect(() => {
    fetch('/api/admin/messages').then(r => r.json()).then(d => setStudents(d.students || []))
  }, [])

  useEffect(() => {
    if (!selected) return
  fetch(`/api/admin/messages?studentId=${selected}`).then(r => r.json()).then(d => { setMessages(d.messages || []); setParticipants(d.participants || []); setStudentCtx(d.student || null) })
  }, [selected])

  return (
  <main className="mx-auto max-w-5xl p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 md:gap-0 gap-0">
      <section className="border bg-white p-3 md:rounded-l-lg md:rounded-r-none rounded-t-lg md:rounded-t-none">
    <div className="font-medium mb-2 text-center md:text-left">Students</div>
        <ul className="space-y-2">
          {students.map(s => (
            <li key={s.id}>
              <button onClick={() => setSelected(s.id)} className={`w-full text-left px-3 py-2 rounded-lg border flex items-center gap-2 ${selected === s.id ? 'bg-brand-50 border-brand-200' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-1">
                  {s.parent && (
                    <Image
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full border"
                      src={s.parent.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent((s.parent.name||s.parent.email||'?').split(' ').map(x=>x[0]).join('').slice(0,2))}`}
                      alt={s.parent.name || 'Parent'}
                    />
                  )}
                  {s.amTherapist && (
                    <Image
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full border"
                      src={s.amTherapist.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent((s.amTherapist.name||s.amTherapist.email||'?').split(' ').map(x=>x[0]).join('').slice(0,2))}`}
                      alt={s.amTherapist.name || 'AM Therapist'}
                    />
                  )}
                  {s.pmTherapist && (
                    <Image
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full border"
                      src={s.pmTherapist.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent((s.pmTherapist.name||s.pmTherapist.email||'?').split(' ').map(x=>x[0]).join('').slice(0,2))}`}
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
        <div className="font-medium mb-2">Messages</div>
        <div className="space-y-6 max-h-[70vh] overflow-auto">
          {/* Simple grouping: show two sections, AM and PM, inferred by therapist email */}
          {['AM','PM'].map(slot => {
            const therapistId = slot === 'AM' ? studentCtx?.amTherapistId : studentCtx?.pmTherapistId
            const parentId = studentCtx?.parentId
            const slotMsgs = messages.filter(m => therapistId && parentId && (
              (m.senderId === parentId && m.receiverId === therapistId) ||
              (m.senderId === therapistId && m.receiverId === parentId)
            ))
            return (
              <div key={slot}>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{slot} Therapist Thread</div>
                <div className="space-y-2">
                  {slotMsgs.map(m => {
                    const sender = participants.find(p => p.id === m.senderId)
                    const isParent = studentCtx ? m.senderId === studentCtx.parentId : (sender?.role || sender?.email || '').toUpperCase().includes('PARENT')
                    // Therapist left, Parent right; avatar between bubble and margin
                    const rowClasses = isParent ? 'justify-end' : 'justify-start'
                    const bubbleColor = isParent ? 'bg-[#0057b8] text-white' : 'bg-[#623394] text-white'
                    const initials = (sender?.name || sender?.email || '?').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()
                    const avatar = sender?.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(initials)}`
                    return (
                      <div key={m.id} className={`flex ${rowClasses}`}>
                        {!isParent && (
                          <Image width={28} height={28} src={avatar} alt={sender?.name || 'avatar'} className="h-7 w-7 rounded-full border self-start mr-2" />
                        )}
                        <div className={`rounded-lg px-3 py-2 max-w-[70%] ${bubbleColor}`}>
                          <div className="text-[10px] opacity-80">{sender?.name || sender?.email} • {new Date(m.createdAt).toLocaleString()}</div>
                          <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                        </div>
                        {isParent && (
                          <Image width={28} height={28} src={avatar} alt={sender?.name || 'avatar'} className="h-7 w-7 rounded-full border self-start ml-2" />
                        )}
                      </div>
                    )
                  })}
                  {slotMsgs.length === 0 && <div className="text-xs text-gray-500">No messages yet for {slot} thread.</div>}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
