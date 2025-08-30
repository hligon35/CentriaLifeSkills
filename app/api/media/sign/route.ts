import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getSession } from '@/lib/session'

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: !!process.env.S3_ENDPOINT,
  credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  } : undefined
})

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await req.json()
  if (typeof key !== 'string') return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  // Basic access control: allow if key includes user's id or user is admin/therapist
  const isOwner = key.includes(user.sub)
  const isStaff = user.role === 'ADMIN' || user.role === 'THERAPIST'
  if (!isOwner && !isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const cmd = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })
  const url = await getSignedUrl(s3, cmd, { expiresIn: 300 })
  return NextResponse.json({ url })
}
