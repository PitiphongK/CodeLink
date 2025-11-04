'use client';
import dynamic from 'next/dynamic';
import { use } from 'react';

const EditorClient = dynamic(() => import('./EditorClient'), { ssr: false });

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <main className="flex flex-col h-screen">
      <div className="p-6 pb-2">
        <h1 className="text-xl font-semibold">Room: {id}</h1>
      </div>
      <div className="flex-1 px-6 pb-6">
        <EditorClient roomId={id} />
      </div>
    </main>
  );
}
