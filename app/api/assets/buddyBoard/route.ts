import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  const cwd = process.cwd()
  const publicPath = path.join(cwd, 'public', 'buddyBoard.png')
  const rootPath = path.join(cwd, 'buddyBoard.png')

  let file: Buffer | null = null
  try {
    file = await fs.readFile(publicPath)
  } catch {
    try {
      file = await fs.readFile(rootPath)
    } catch {
      file = null
    }
  }

  if (!file) {
    return new Response('Not found', { status: 404 })
  }

  const bytes = new Uint8Array(file)
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
