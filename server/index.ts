import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:3000'], credentials: true }
});

io.on('connection', (socket) => {
  console.log('connected', socket.id);

  socket.on('ping:client', (msg, ack) => {
    console.log('got', msg);
    ack?.({ ok: true, at: Date.now() }); // acknowledgement back to client
  });

  socket.on('disconnect', (reason) => {
    console.log('bye', socket.id, reason);
  });
});

io.on('connection', (socket) => {
  socket.on('room:join', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('room:notice', { type: 'join', id: socket.id });
  });

  socket.on('room:leave', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('room:notice', { type: 'leave', id: socket.id });
  });

  socket.on('room:message', ({ roomId, text }) => {
    io.to(roomId).emit('room:message', { id: socket.id, text });
  });
});

server.listen(4000, () => console.log('Socket.IO on :4000'));
