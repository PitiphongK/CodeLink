'use client';
import dynamic from 'next/dynamic';
import { use } from 'react';

const EditorClient = dynamic(() => import('./EditorClient'), { ssr: false });

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Room: {id}</h1>
      <EditorClient roomId={id} />
    </main>
  );
}
