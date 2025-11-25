'use client';
import Toolbar from '@/app/components/Toolbar';
import dynamic from 'next/dynamic';
import { use, useState } from 'react';

const EditorClient = dynamic(() => import('./EditorClient'), { ssr: false });

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <EditorClient roomId={id} />
    </main>
  );
}
