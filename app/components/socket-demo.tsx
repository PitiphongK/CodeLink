'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function SocketDemo() {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    const s = io('https://codelink-hsdm.onrender.com', { withCredentials: true });
    socketRef.current = s;

    s.on('connect', () => setStatus('connected'));
    s.on('disconnect', () => setStatus('disconnected'));

    // cleanup
    return () => { s.disconnect(); };
  }, []);

  const pingServer = () => {
    socketRef.current?.emit('ping:client', { hello: 'world' }, (ack: { ok: boolean, at: number }) => {
      console.log('ack from server', ack);
    });
  };

  return ( 
    <div className="p-4">
      <div>Status: {status}</div>
      <button onClick={pingServer}>Ping</button>
    </div>
  );
}
