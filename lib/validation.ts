import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['THERAPIST', 'PARENT', 'ADMIN'])
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export const MessageCreateSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().max(20000), // allow ciphertext
  mediaUrl: z.string().url().optional(),
  mediaType: z.string().optional(),
  iv: z.string().optional() // base64 IV for E2EE
})

export const PostCreateSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(20000),
  imageUrl: z.string().url().optional(),
  pinned: z.boolean().optional(),
})

export const CommentCreateSchema = z.object({
  postId: z.string().min(1),
  body: z.string().max(5000)
})

// Minimal sanitizer for server-side: strips angle brackets.
export function sanitize(input: string) {
  return input.replace(/[<>]/g, '')
}

export const StudentNoteSchema = z.object({
  body: z.string().min(1).max(10000),
  visibility: z.enum(['STAFF', 'PARENT']).optional(),
})

export const DailyLogSchema = z.object({
  date: z.string().datetime().optional(),
  activities: z.string().max(10000).optional(),
  meals: z.string().max(1000).optional(),
  naps: z.string().max(1000).optional(),
  notes: z.string().max(5000).optional(),
})

export const ProgressReportSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(20000),
  goalsJson: z.string().max(50000).optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
})

export const RsvpSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(['YES', 'NO', 'MAYBE']),
  comment: z.string().max(1000).optional(),
})

// Template feature removed

export const AvailabilitySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
})

export const AppointmentCreateSchema = z.object({
  therapistId: z.string().min(1).optional(),
  parentId: z.string().min(1),
  studentId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
})

export const PreferenceSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.union([z.string(), z.number(), z.boolean()]).transform(v => String(v)),
})
