'use client';
import dynamic from 'next/dynamic';
import { use } from 'react';

const EditorClient = dynamic(() => import('./EditorClient'), { ssr: false });

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <main className="flex flex-col h-screen">
      <EditorClient roomId={id} />
    </main>
  );
}
