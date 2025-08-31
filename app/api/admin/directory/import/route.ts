import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import argon2 from 'argon2'

type ImportBody = {
  type: 'users' | 'students'
  csv: string
}

function parseCSV(csv: string): string[][] {
  // Very simple line-split CSV; expects no embedded commas/quotes.
  return csv
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => l.split(',').map(c => c.trim()))
}

export async function POST(req: NextRequest) {
  const me = await getSession()
  if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: ImportBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { type, csv } = body || {}
  if (!type || !csv) return NextResponse.json({ error: 'Missing type or csv' }, { status: 400 })

  const rows = parseCSV(csv)
  if (rows.length === 0) return NextResponse.json({ error: 'No rows' }, { status: 400 })

  if (type === 'users') {
    // Columns: email,name,role,photoUrl
    const pass = await argon2.hash('Password123!')
    const results: any[] = []
    for (const [email, name, role, photoUrl] of rows) {
      if (!email || !role) continue
      const roleU = role.toUpperCase()
      if (!['ADMIN', 'THERAPIST', 'PARENT'].includes(roleU)) continue
      const user = await prisma.user.upsert({
        where: { email },
        update: { name: name || undefined, role: roleU, photoUrl: photoUrl || undefined },
        create: { email, name: name || null, role: roleU, passwordHash: pass, photoUrl: photoUrl || null },
      })
      results.push({ email: user.email, role: user.role })
    }
    return NextResponse.json({ ok: true, imported: results.length, users: results })
  }

  if (type === 'students') {
    // Columns: name,parentEmail,amTherapistEmail,pmTherapistEmail
    const pass = await argon2.hash('Password123!')
    const out: any[] = []
    for (const [name, parentEmail, amEmail, pmEmail] of rows) {
      if (!name || !parentEmail || !amEmail || !pmEmail) continue
      // Ensure users exist for parent and therapists
      const parent = await prisma.user.upsert({
        where: { email: parentEmail },
        update: {},
        create: { email: parentEmail, role: 'PARENT', passwordHash: pass }
      })
      const am = await prisma.user.upsert({
        where: { email: amEmail },
        update: {},
        create: { email: amEmail, role: 'THERAPIST', passwordHash: pass }
      })
      const pm = await prisma.user.upsert({
        where: { email: pmEmail },
        update: {},
        create: { email: pmEmail, role: 'THERAPIST', passwordHash: pass }
      })
      const stu = await prisma.student.create({
        data: { name, parentId: parent.id, amTherapistId: am.id, pmTherapistId: pm.id }
      })
      out.push({ id: stu.id, name: stu.name })
    }
    return NextResponse.json({ ok: true, imported: out.length, students: out })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
