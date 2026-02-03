import { type ChildProcessWithoutNullStreams, spawn } from 'child_process'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import type { Server, Socket } from 'socket.io'
import ts from 'typescript'

const ROOM_ID_RE = /^[a-z]{3}-[a-z]{3}-[a-z]{3}$/

type JoinOptions = {
  cols?: number
  rows?: number
}

type RoomTerminal = {
  roomId: string
  proc: ChildProcessWithoutNullStreams | null
  workDir: string | null
  buffer: string
  clients: Set<string>
  cleanupTimer: NodeJS.Timeout | null
}

function safeRoomId(roomId: unknown): string | null {
  if (typeof roomId !== 'string') return null
  const trimmed = roomId.trim()
  return ROOM_ID_RE.test(trimmed) ? trimmed : null
}

export class TerminalManager {
  private readonly io: Server
  private readonly sessions = new Map<string, RoomTerminal>()

  // Keep the last N chars for late joiners.
  private readonly maxBufferChars = 64_000

  // If a room has no viewers, kill the PTY after this delay.
  private readonly idleKillMs = 30_000

  // Kill any run that exceeds this duration.
  private readonly runTimeoutMs = 10_000

  // Limit buffered + streamed output to prevent memory abuse.
  private readonly maxTotalOutputChars = 256_000

  constructor(io: Server) {
    this.io = io
  }

  join(socket: Socket, roomIdRaw: unknown, options?: JoinOptions) {
    const roomId = safeRoomId(roomIdRaw)
    if (!roomId) {
      socket.emit('terminal:error', { error: 'Invalid room id' })
      return
    }

    socket.join(roomId)

    const session = this.getOrCreate(roomId, options)
    session.clients.add(socket.id)

    // Cancel pending cleanup if someone re-joins.
    if (session.cleanupTimer) {
      clearTimeout(session.cleanupTimer)
      session.cleanupTimer = null
    }

    // Send buffered output so the terminal isn't blank for late joiners.
    if (session.buffer) {
      socket.emit('terminal:data', session.buffer)
    }
  }

  leave(socket: Socket, roomIdRaw: unknown) {
    const roomId = safeRoomId(roomIdRaw)
    if (!roomId) return

    socket.leave(roomId)
    const session = this.sessions.get(roomId)
    if (!session) return

    session.clients.delete(socket.id)

    this.maybeScheduleCleanup(session)
  }

  onDisconnect(socket: Socket) {
    for (const session of this.sessions.values()) {
      if (!session.clients.has(socket.id)) continue

      session.clients.delete(socket.id)

      this.maybeScheduleCleanup(session)
    }
  }

  resize(socket: Socket, roomIdRaw: unknown, size: unknown) {
    const roomId = safeRoomId(roomIdRaw)
    if (!roomId) return

    const session = this.sessions.get(roomId)
    if (!session) return
    // No-op: we don't run a PTY anymore.
    void size
  }

  async run(socket: Socket, payload: unknown) {
    const payloadObj: Record<string, unknown> =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : {}

    const roomId = safeRoomId(payloadObj.roomId)
    if (!roomId) {
      socket.emit('terminal:error', { error: 'Invalid room id' })
      return
    }

    const session = this.getOrCreate(roomId)

    const rawLanguage = payloadObj.language
    const language = this.normalizeLanguage(rawLanguage)
    if (!language) {
      socket.emit('terminal:error', { error: 'Unsupported language' })
      return
    }

    const code = typeof payloadObj.code === 'string' ? payloadObj.code : ''
    if (!code.trim()) {
      socket.emit('terminal:error', { error: 'No code provided' })
      return
    }

    if (code.length > 200_000) {
      socket.emit('terminal:error', { error: 'Code too large' })
      return
    }

    // Cancel pending cleanup while a run is requested.
    if (session.cleanupTimer) {
      clearTimeout(session.cleanupTimer)
      session.cleanupTimer = null
    }

    // Kill any prior process for the room.
    this.killProcess(session)

    // Clear buffer and clear everyone’s screen.
    session.buffer = ''
    this.io.to(roomId).emit('terminal:data', '\x1bc\x1b[2J\x1b[H')

    try {
      const workDir = await this.prepareWorkDir(session, roomId)

      const { command, args, displayCommand } = await this.buildCommand({
        language,
        code,
        workDir,
      })
      this.emit(roomId, `\r\n$ ${displayCommand}\r\n`)

      const proc = spawn(command, args, {
        cwd: workDir,
        env: {
          PATH: process.env.PATH ?? '',
          // Reduce accidental env leakage.
          NODE_ENV: 'production',
          PYTHONUNBUFFERED: '1',
        },
      })

      session.proc = proc

      let totalChars = 0
      let killedForLimit = false

      const onChunk = (chunk: Buffer | string) => {
        if (!session.proc) return
        const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
        totalChars += text.length

        if (totalChars > this.maxTotalOutputChars) {
          killedForLimit = true
          this.emit(roomId, `\r\n[output limit reached; terminating]\r\n`)
          this.killProcess(session)
          return
        }

        session.buffer += text
        if (session.buffer.length > this.maxBufferChars) {
          session.buffer = session.buffer.slice(
            session.buffer.length - this.maxBufferChars
          )
        }

        this.io.to(roomId).emit('terminal:data', text)
      }

      proc.stdout.on('data', onChunk)
      proc.stderr.on('data', onChunk)

      const timeout = setTimeout(() => {
        if (!session.proc) return
        this.emit(
          roomId,
          `\r\n[timed out after ${Math.round(this.runTimeoutMs / 1000)}s]\r\n`
        )
        this.killProcess(session)
      }, this.runTimeoutMs)

      proc.on('close', (exitCode, signal) => {
        clearTimeout(timeout)
        session.proc = null

        // Keep param for potential debugging; intentionally unused.
        void signal

        if (killedForLimit) {
          this.io
            .to(roomId)
            .emit('terminal:exit', { exitCode: -1, signal: undefined })
          return
        }

        this.io.to(roomId).emit('terminal:exit', { exitCode: exitCode ?? -1 })
        this.maybeScheduleCleanup(session)
      })

      proc.on('error', (err) => {
        clearTimeout(timeout)
        session.proc = null
        socket.emit('terminal:error', {
          error: err instanceof Error ? err.message : String(err),
        })
        this.maybeScheduleCleanup(session)
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      socket.emit('terminal:error', { error: message })
      this.maybeScheduleCleanup(session)
    }
  }

  private getOrCreate(roomId: string, options?: JoinOptions) {
    const existing = this.sessions.get(roomId)
    if (existing) return existing

    // Keep options to avoid breaking callers; they are unused in runner mode.
    void options

    const session: RoomTerminal = {
      roomId,
      proc: null,
      workDir: null,
      buffer: '',
      clients: new Set(),
      cleanupTimer: null,
    }

    this.sessions.set(roomId, session)
    return session
  }

  private normalizeLanguage(
    value: unknown
  ): 'python' | 'javascript' | 'typescript' | null {
    if (typeof value !== 'string') return null
    const v = value.trim().toLowerCase()
    if (v === 'py' || v === 'python') return 'python'
    if (v === 'js' || v === 'javascript') return 'javascript'
    if (v === 'ts' || v === 'typescript') return 'typescript'
    return null
  }

  private emit(roomId: string, data: string) {
    this.io.to(roomId).emit('terminal:data', data)
  }

  private killProcess(session: RoomTerminal) {
    const proc = session.proc
    if (!proc) return
    try {
      proc.kill('SIGKILL')
    } catch {
      // ignore
    }
    session.proc = null
  }

  private async prepareWorkDir(session: RoomTerminal, roomId: string) {
    if (session.workDir) return session.workDir
    const random = crypto.randomBytes(6).toString('hex')
    const workDir = await fs.mkdtemp(
      path.join(os.tmpdir(), `codelink-${roomId}-${random}-`)
    )
    session.workDir = workDir
    return workDir
  }

  private async buildCommand(opts: {
    language: 'python' | 'javascript' | 'typescript'
    code: string
    workDir: string
  }): Promise<{ command: string; args: string[]; displayCommand: string }> {
    const { language, code, workDir } = opts

    if (language === 'python') {
      const file = path.join(workDir, 'main.py')
      await fs.writeFile(file, code, 'utf8')
      return {
        command: 'python3',
        args: ['-u', 'main.py'],
        displayCommand: 'python3 -u main.py',
      }
    }

    if (language === 'javascript') {
      const file = path.join(workDir, 'main.js')
      await fs.writeFile(file, code, 'utf8')
      return {
        command: 'node',
        args: ['main.js'],
        displayCommand: 'node main.js',
      }
    }

    // TypeScript: transpile to JS and run with node.
    const js = ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        sourceMap: false,
        inlineSourceMap: false,
      },
      reportDiagnostics: false,
    }).outputText

    await fs.writeFile(path.join(workDir, 'main.ts'), code, 'utf8')
    await fs.writeFile(path.join(workDir, 'main.js'), js, 'utf8')
    return {
      command: 'node',
      args: ['main.js'],
      displayCommand: 'node main.js  # (from TS transpile)',
    }
  }

  private maybeScheduleCleanup(session: RoomTerminal) {
    if (session.clients.size > 0) return
    if (session.cleanupTimer) return

    session.cleanupTimer = setTimeout(() => {
      if (session.clients.size === 0) {
        this.dispose(session.roomId)
      }
    }, this.idleKillMs)
  }

  private dispose(roomId: string) {
    const session = this.sessions.get(roomId)
    if (!session) return

    if (session.cleanupTimer) {
      clearTimeout(session.cleanupTimer)
    }

    this.killProcess(session)

    if (session.workDir) {
      // Best-effort cleanup; temp dirs are isolated per room.
      fs.rm(session.workDir, { recursive: true, force: true }).catch(
        () => undefined
      )
      session.workDir = null
    }

    this.sessions.delete(roomId)
  }
}
