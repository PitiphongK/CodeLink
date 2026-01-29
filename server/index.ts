import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

import { TerminalManager } from './terminal'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: ['http://localhost:3000'], credentials: true },
})

const terminalManager = new TerminalManager(io)

io.on('connection', (socket) => {
  console.log('connected', socket.id)

  socket.on('ping:client', (msg, ack) => {
    console.log('got', msg)
    ack?.({ ok: true, at: Date.now() })
  })

  socket.on('room:join', (roomId) => {
    socket.join(roomId)
    socket.to(roomId).emit('room:notice', { type: 'join', id: socket.id })
  })

  socket.on('room:leave', (roomId) => {
    socket.leave(roomId)
    socket.to(roomId).emit('room:notice', { type: 'leave', id: socket.id })
  })

  socket.on('room:message', ({ roomId, text }) => {
    io.to(roomId).emit('room:message', { id: socket.id, text })
  })

  // Shared terminal (PTY) per room.
  socket.on('terminal:join', (roomId, opts) => {
    terminalManager.join(socket, roomId, opts)
  })

  socket.on('terminal:leave', (roomId) => {
    terminalManager.leave(socket, roomId)
  })

  // Output-only shared runner.
  socket.on('terminal:run', (payload) => {
    void terminalManager.run(socket, payload)
  })

  socket.on('terminal:resize', ({ roomId, cols, rows }) => {
    terminalManager.resize(socket, roomId, { cols, rows })
  })

  socket.on('disconnect', (reason) => {
    console.log('bye', socket.id, reason)
    terminalManager.onDisconnect(socket)
  })
})

server.listen(4000, () => console.log('Socket.IO on :4000'))
