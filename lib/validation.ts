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
  imageUrl: z.string().url().optional()
})

export const CommentCreateSchema = z.object({
  postId: z.string().min(1),
  body: z.string().max(5000)
})

// Minimal sanitizer for server-side: strips angle brackets.
export function sanitize(input: string) {
  return input.replace(/[<>]/g, '')
}
