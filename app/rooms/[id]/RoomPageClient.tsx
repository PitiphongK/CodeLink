'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidRoomCode } from '@/app/utils/roomCode';

const EditorClient = dynamic(() => import('./EditorClient'), { ssr: false });

type Props = {
  id: string;
};

export default function RoomPageClient({ id }: Props) {
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
