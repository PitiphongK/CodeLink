import { NextRequest } from 'next/server'
import { spawn } from 'child_process'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code: string = body?.code ?? ''
    const language: string = (body?.language || 'python').toLowerCase()

    if (!code) {
      return new Response(JSON.stringify({ error: 'No code provided' }), { status: 400 })
    }

    if (language !== 'python') {
      return new Response(JSON.stringify({ error: 'Only python is supported by this endpoint' }), { status: 400 })
    }

    // Spawn python process. Use -u for unbuffered stdout/stderr so we can collect output promptly.
    // We run the code via `-c` to avoid writing files. This is NOT sandboxed and can be dangerous.
    const proc = spawn('python3', ['-u', '-c', code], { timeout: 0 })

    let stdout = ''
    let stderr = ''
    let timedOut = false

    // Safety: kill after 7s
    const killTimeout = setTimeout(() => {
      try {
        proc.kill('SIGKILL')
        timedOut = true
      } catch (e) {
        // ignore
      }
    }, 7000)

    proc.stdout.on('data', (data) => {
      stdout += String(data)
    })

    proc.stderr.on('data', (data) => {
      stderr += String(data)
    })

    const exitCode: number = await new Promise((resolve) => {
      proc.on('close', (code) => {
        clearTimeout(killTimeout)
        resolve(code === null ? -1 : code)
      })
      proc.on('error', (err) => {
        clearTimeout(killTimeout)
        stderr += String(err.message || err)
        resolve(-1)
      })
    })

    return new Response(JSON.stringify({ stdout, stderr, exitCode, timedOut }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 500 })
  }
}
