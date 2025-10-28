'use client';

import dynamic from 'next/dynamic';

const CodeEditor = dynamic(() => import('@/app/components/code-editor'), { ssr: false });

export default function Page() {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Demo</h1>
      <CodeEditor />
    </main>
  );
}