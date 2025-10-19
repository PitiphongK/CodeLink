'use client';

import CodeEditor from '@/app/components/code-editor';

export default function Page() {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Demo</h1>
      <CodeEditor />
    </main>
  );
}