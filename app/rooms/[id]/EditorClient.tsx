'use client';

import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

type Props = { roomId: string };

// simple helpers
function randColor() {
  return '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
}
function userName() {
  return 'User ' + Math.floor(Math.random()*1000);
}

export default function EditorClient({ roomId }: Props) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // Create/destroy Yjs doc + provider when room changes
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      'wss://demos.yjs.dev/ws',
      roomId,
      ydoc
    );

    // set presence
    provider.awareness.setLocalStateField('user', {
      name: userName(),
      color: randColor(),
    });

    ydocRef.current = ydoc;
    providerRef.current = provider;

    return () => {
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
    };
  }, [roomId]);

  // Bind Monaco ⇄ Yjs after the editor mounts (and only in the browser)
  const handleMount = async (editor: import('monaco-editor').editor.IStandaloneCodeEditor) => {
    const ydoc = ydocRef.current!;
    const provider = providerRef.current!;
    const ytext = ydoc.getText('monaco');

    // IMPORTANT: dynamically import y-monaco only on client
    const { MonacoBinding } = await import('y-monaco');

    const model = editor.getModel();
    if (model) {
      new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        provider.awareness
      );
    }

    // optional: initial value
    if (!editor.getValue()) {
      editor.setValue(`// Room: ${roomId}
function add(a, b) { return a + b }
`);
    }
  };

  return (
    <Editor
      height="70vh"
      defaultLanguage="javascript"
      theme="vs-dark"
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        fontSize: 14,
      }}
      onMount={handleMount}
    />
  );
}
