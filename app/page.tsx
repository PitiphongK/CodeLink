'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [roomId, setRoomId] = useState('demo-room');
  const router = useRouter();

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <input
          className="rounded border px-3 py-2"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="room id"
        />
        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={() => router.push(`/rooms/${encodeURIComponent(roomId)}`)}
        >
          Join room
        </button>
      </div>
    </main>
  );
}
