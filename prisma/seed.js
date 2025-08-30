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
  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: { email: 'parent@example.com', name: 'Parent Bob', role: 'PARENT', passwordHash: pass, photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=PB' }
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
      pmTherapistId: therapist2.id
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
  const postCount = await prisma.post.count()
  if (postCount === 0) {
    const demoPosts = [
      { authorId: admin.id, title: 'Welcome to BuddyBoard', body: 'This is our school message board for quick updates, reminders, and celebrations.' },
      { authorId: therapist.id, title: 'Classroom Supplies', body: 'We\'re running low on glue sticks and tissues. Donations are appreciated—thank you! 😊' },
      { authorId: therapist2.id, title: 'Field Day Friday', body: 'Wear comfortable clothes and bring a water bottle. Sunscreen recommended.' },
      { authorId: admin.id, title: 'Safety Drill', body: 'We\'ll have a brief safety drill tomorrow morning. No action needed from families.' },
      { authorId: parent.id, title: 'Thank you team!', body: 'Appreciate all the progress updates lately—Sam is loving circle time!' }
    ]
    const created = []
    for (const p of demoPosts) {
      created.push(await prisma.post.create({ data: p }))
    }
    // Add a couple comments and likes to first two posts
    if (created[0]) {
      await prisma.comment.create({ data: { postId: created[0].id, authorId: therapist.id, body: 'Welcome everyone! 👋' } })
      await prisma.postLike.createMany({ data: [
        { postId: created[0].id, userId: admin.id },
        { postId: created[0].id, userId: parent.id }
      ] })
    }
    if (created[1]) {
      await prisma.comment.create({ data: { postId: created[1].id, authorId: parent.id, body: 'We\'ll bring some tissues this week.' } })
      await prisma.postLike.create({ data: { postId: created[1].id, userId: therapist2.id } })
    }
  }

  console.log({ therapist: therapist.email, therapist2: therapist2.email, parent: parent.email, admin: admin.email, student: student.name })
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
