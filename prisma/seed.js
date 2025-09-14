const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')

const prisma = new PrismaClient()

async function main() {
  const pass = await argon2.hash('Password123!')
  const therapist = await prisma.user.upsert({
    where: { email: 'therapist@example.com' },
    update: {},
    create: { email: 'therapist@example.com', name: 'Therapist Alice', role: 'THERAPIST', passwordHash: pass, photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=TA' }
  })
  const therapist2 = await prisma.user.upsert({
    where: { email: 'therapist2@example.com' },
    update: {},
    create: { email: 'therapist2@example.com', name: 'Therapist Ben', role: 'THERAPIST', passwordHash: pass, photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=TB' }
  })
  const therapist3 = await prisma.user.upsert({
    where: { email: 'therapist3@example.com' },
    update: {},
    create: { email: 'therapist3@example.com', name: 'Therapist Chloe', role: 'THERAPIST', passwordHash: pass, photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=TC' }
  })
  // Assign therapist3 as BCBA for demo purposes
  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: { email: 'parent@example.com', name: 'Parent Bob', role: 'PARENT', passwordHash: pass, photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=PB' }
  })
  const parent2 = await prisma.user.upsert({
    where: { email: 'parent2@example.com' },
    update: {},
    create: { email: 'parent2@example.com', name: 'Parent Dana', role: 'PARENT', passwordHash: pass, photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=PD' }
  })
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Admin Carol', role: 'ADMIN', passwordHash: pass, photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=AC' }
  })

  // Create a sample student linking parent with AM/PM therapists
  const student = await prisma.student.upsert({
    where: { id: 'seed-student-1' },
    update: {},
    create: {
      id: 'seed-student-1',
      name: 'Student Sam',
      parentId: parent.id,
      amTherapistId: therapist.id,
      pmTherapistId: therapist2.id,
      bcbaId: therapist3.id
    }
  })

  const student2 = await prisma.student.upsert({
    where: { id: 'seed-student-2' },
    update: {},
    create: {
      id: 'seed-student-2',
      name: 'Student Riley',
      parentId: parent2.id,
      amTherapistId: therapist2.id,
      pmTherapistId: therapist3.id,
      bcbaId: therapist.id
    }
  })

  const student3 = await prisma.student.upsert({
    where: { id: 'seed-student-3' },
    update: {},
    create: {
      id: 'seed-student-3',
      name: 'Student Morgan',
      parentId: parent.id,
      amTherapistId: therapist3.id,
      pmTherapistId: therapist.id,
      bcbaId: therapist2.id
    }
  })

  // Sample messages Parent <-> AM Therapist
  await prisma.message.createMany({ data: [
    { senderId: parent.id, receiverId: therapist.id, content: 'Hi, quick update about Sam\'s morning.' },
    { senderId: therapist.id, receiverId: parent.id, content: 'Thanks! Sam did great in OT activities today.' }
  ] })

  // Sample messages Parent <-> PM Therapist
  await prisma.message.createMany({ data: [
    { senderId: parent.id, receiverId: therapist2.id, content: 'Afternoon pickup will be at 3:15.' },
    { senderId: therapist2.id, receiverId: parent.id, content: 'Noted. We\'ll be ready at the front desk.' }
  ] })

  // Seed 5 sample posts for the message board (only if none exist)
  const placeholder = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80&auto=format&fit=crop'
  const demoPosts = [
    { id: 'seed-post-1', authorId: admin.id, title: 'Welcome to BuddyBoard', body: 'This is our school message board for quick updates, reminders, and celebrations.', imageUrl: placeholder, pinned: true, category: 'ANNOUNCEMENT', tags: 'welcome,intro' },
    { id: 'seed-post-2', authorId: therapist.id, title: 'Classroom Supplies', body: 'We\'re running low on glue sticks and tissues. Donations are appreciated—thank you! 😊', category: 'NEWS', tags: 'supplies' },
    { id: 'seed-post-3', authorId: therapist2.id, title: 'Field Day Friday', body: 'Wear comfortable clothes and bring a water bottle. Sunscreen recommended.', imageUrl: placeholder, category: 'EVENT' },
    { id: 'seed-post-4', authorId: admin.id, title: 'Safety Drill', body: 'We\'ll have a brief safety drill tomorrow morning. No action needed from families.', category: 'SAFETY' },
    { id: 'seed-post-5', authorId: parent.id, title: 'Thank you team!', body: 'Appreciate all the progress updates lately—Sam is loving circle time!', category: 'KUDOS' }
  ]
  const created = []
  for (const p of demoPosts) {
  created.push(await prisma.post.upsert({ where: { id: p.id }, update: { title: p.title, body: p.body, imageUrl: p.imageUrl || null, pinned: !!p.pinned, category: p.category || null, tags: p.tags || null }, create: p }))
  }
    // Add a couple comments and likes to first two posts
  if (created[0]) {
    // Avoid duplicating the same seed comment/likes by checking existence
    const existsC1 = await prisma.comment.findFirst({ where: { postId: created[0].id, authorId: therapist.id, body: 'Welcome everyone! 👋' } })
    if (!existsC1) await prisma.comment.create({ data: { postId: created[0].id, authorId: therapist.id, body: 'Welcome everyone! 👋' } })
    await prisma.postLike.upsert({ where: { postId_userId: { postId: created[0].id, userId: admin.id } }, update: {}, create: { postId: created[0].id, userId: admin.id } })
    await prisma.postLike.upsert({ where: { postId_userId: { postId: created[0].id, userId: parent.id } }, update: {}, create: { postId: created[0].id, userId: parent.id } })
  }
  if (created[1]) {
    const existsC2 = await prisma.comment.findFirst({ where: { postId: created[1].id, authorId: parent.id, body: 'We\'ll bring some tissues this week.' } })
    if (!existsC2) await prisma.comment.create({ data: { postId: created[1].id, authorId: parent.id, body: 'We\'ll bring some tissues this week.' } })
    await prisma.postLike.upsert({ where: { postId_userId: { postId: created[1].id, userId: therapist2.id } }, update: {}, create: { postId: created[1].id, userId: therapist2.id } })
  }

  // Demo events
  const now = new Date()
  const start1 = new Date(now.getFullYear(), now.getMonth(), Math.min(10, 28), 9, 0, 0)
  const end1 = new Date(start1.getFullYear(), start1.getMonth(), start1.getDate(), 10, 0, 0)
  const start2 = new Date(now.getFullYear(), now.getMonth(), Math.min(18, 28), 13, 0, 0)
  const end2 = new Date(start2.getFullYear(), start2.getMonth(), start2.getDate(), 14, 0, 0)
  await prisma.event.upsert({ where: { id: 'seed-evt-1' }, update: { title: 'IEP Meeting Window', description: 'Check your inbox for assigned times.', audience: 'PARENT', startAt: start1, endAt: end1 }, create: { id: 'seed-evt-1', title: 'IEP Meeting Window', description: 'Check your inbox for assigned times.', audience: 'PARENT', startAt: start1, endAt: end1 } })
  await prisma.event.upsert({ where: { id: 'seed-evt-2' }, update: { title: 'Staff PD', description: 'Professional development afternoon.', audience: 'THERAPIST', startAt: start2, endAt: end2 }, create: { id: 'seed-evt-2', title: 'Staff PD', description: 'Professional development afternoon.', audience: 'THERAPIST', startAt: start2, endAt: end2 } })

  // RSVPs
  await prisma.eventRsvp.upsert({ where: { eventId_userId: { eventId: 'seed-evt-1', userId: parent.id } }, update: { status: 'YES' }, create: { eventId: 'seed-evt-1', userId: parent.id, status: 'YES' } })
  await prisma.eventRsvp.upsert({ where: { eventId_userId: { eventId: 'seed-evt-2', userId: therapist.id } }, update: { status: 'MAYBE' }, create: { eventId: 'seed-evt-2', userId: therapist.id, status: 'MAYBE' } })

  // Templates removed

  // Availability
  await prisma.therapistAvailability.upsert({ where: { id: 'seed-av-1' }, update: {}, create: { id: 'seed-av-1', therapistId: therapist.id, weekday: 1, startTime: '09:00', endTime: '12:00' } })
  await prisma.therapistAvailability.upsert({ where: { id: 'seed-av-2' }, update: {}, create: { id: 'seed-av-2', therapistId: therapist.id, weekday: 3, startTime: '13:00', endTime: '16:00' } })

  // Appointments
  const apptStart = new Date(now.getFullYear(), now.getMonth(), Math.min(20, 28), 11, 0, 0)
  const apptEnd = new Date(apptStart.getFullYear(), apptStart.getMonth(), apptStart.getDate(), 11, 30, 0)
  // Parent ↔ BCBA monthly meeting (use bcbaId assigned above)
  await prisma.appointment.upsert({ where: { id: 'seed-appt-1' }, update: {}, create: { id: 'seed-appt-1', therapistId: (await prisma.student.findUnique({ where: { id: student.id } })).bcbaId, parentId: parent.id, studentId: student.id, startAt: apptStart, endAt: apptEnd, status: 'CONFIRMED' } })

  // Daily logs and notes
  await prisma.dailyLog.create({ data: { studentId: student.id, authorId: therapist.id, activities: 'Circle time, OT exercises', meals: 'Ate 50% of lunch', naps: '30 min nap', notes: 'Great engagement today.' } })
  await prisma.studentNote.create({ data: { studentId: student.id, authorId: therapist.id, body: 'Consider trying a visual schedule at home.', visibility: 'PARENT' } })
  await prisma.progressReport.create({ data: { studentId: student.id, authorId: therapist.id, title: 'Q1 Progress', body: 'Sam is making steady progress on goals A and B.', goalsJson: JSON.stringify([{ goal: 'Fine motor', progress: 'Improving' }]) } })

  console.log({
    therapist: therapist.email,
    therapist2: therapist2.email,
    therapist3: therapist3.email,
    parent: parent.email,
    parent2: parent2.email,
    admin: admin.email,
    student: student.name,
    student2: student2.name,
    student3: student3.name,
  })
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
