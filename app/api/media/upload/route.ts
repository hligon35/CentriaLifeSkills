import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
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

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  // TODO: image/video compression before upload (client-side preferred). Server-side compression can be added with sharp/ffmpeg.

  const key = `media/${user.sub}/${Date.now()}-${randomUUID()}-${file.name}`
  const arrayBuffer = await file.arrayBuffer()
  await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: Buffer.from(arrayBuffer), ContentType: file.type }))

  // Access control: serve via signed URLs or middleware that verifies JWT.
  const mediaUrl = `s3://${process.env.S3_BUCKET}/${key}`
  return NextResponse.json({ url: mediaUrl })
}
