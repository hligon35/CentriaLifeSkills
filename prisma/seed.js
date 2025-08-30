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

  console.log({ therapist: therapist.email, therapist2: therapist2.email, parent: parent.email, admin: admin.email, student: student.name })
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
