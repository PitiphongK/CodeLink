'use client';
import dynamic from 'next/dynamic';
import { use } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidRoomCode } from '@/app/utils/roomCode';

const EditorClient = dynamic(() => import('./EditorClient'), { ssr: false });

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Validate room code format and redirect if invalid
    if (!isValidRoomCode(id)) {
      router.replace(`/?error=invalid-room-code`);
      return;
    }
    try {
      const storedName = sessionStorage.getItem('userName');
      if (!storedName) {
        router.replace(`/?join=${encodeURIComponent(id)}`);
      }
    } catch {
      // sessionStorage not available (shouldn't happen in client); ignore
    }
  }, [id, router]);
  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <EditorClient roomId={id} />
    </main>
  );
}
