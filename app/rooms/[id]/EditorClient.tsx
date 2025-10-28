'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';

type Props = { roomId: string };

// simple helper
function randColor() {
  return '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
}

export default function EditorClient({ roomId }: Props) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Create/destroy Yjs doc + provider when room changes
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      'wss://demos.yjs.dev/ws',
      roomId,
      ydoc
    );

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setUsers(states.map(state => state.user));
    };

    provider.awareness.on('change', updateUsers);
    updateUsers(); // Initial update

    // set presence
    const userName = sessionStorage.getItem('userName') || 'Anonymous';
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: randColor(),
    });

    ydocRef.current = ydoc;
    providerRef.current = provider;

    return () => {
      provider.awareness.off('change', updateUsers);
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
    <div>
      <div className="p-4">
        <h2 className="text-lg font-semibold">Users in room:</h2>
        <ul>
          {users.map((user, i) => (
            <li key={i} style={{ color: user.color }}>
              {user.name}
            </li>
          ))}
        </ul>
      </div>
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
    </div>
  );
}
