import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

function checkToken(req: NextRequest) {
  const cfg = process.env.ADMIN_MAINT_TOKEN
  if (!cfg) return false
  const h = req.headers.get('x-maint-token') || ''
  const url = new URL(req.url)
  const q = url.searchParams.get('token') || ''
  return h === cfg || q === cfg
}

export async function POST(req: NextRequest) {
  if (!checkToken(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // Run: npx prisma db push --accept-data-loss
  // Render installs devDeps during build by default, so prisma CLI should be available at runtime.
  return await new Promise<NextResponse>((resolve) => {
    const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
      env: process.env,
    })
    let stdout = ''
    let stderr = ''
    let settled = false
    const finish = (status: number) => {
      if (settled) return
      settled = true
      if (status === 0) resolve(NextResponse.json({ ok: true, stdout }))
      else resolve(NextResponse.json({ error: 'db push failed', stdout, stderr }, { status: 500 }))
    }
    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('error', (err) => { stderr += String(err) })
    child.on('close', (code) => finish(code ?? 1))
    // Safety timeout (90s)
    setTimeout(() => {
      try { child.kill('SIGKILL') } catch {}
      finish(1)
    }, 90_000)
  })
}
