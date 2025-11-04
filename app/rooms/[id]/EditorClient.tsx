'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';
import { Button } from '@heroui/react';
import ResizablePanels from '@/app/components/ResizablePanels';
import DrawingBoard from '@/app/components/DrawingBoard';

type Props = { roomId: string };

// simple helper
function randColor() {
  return '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
}

export default function EditorClient({ roomId }: Props) {
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
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

  const handleInvite = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Invite link copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
      alert('Failed to copy invite link.');
    });
  };

  const handleExport = () => {
    if (editorRef.current) {
      const content = editorRef.current.getValue();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codelink-room-${roomId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportClick = () => {
    const input = document.getElementById('file-importer');
    if (input) {
      input.click();
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editorRef.current) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        editorRef.current?.setValue(content);
      };
      reader.readAsText(file);
    }
  };

  // Bind Monaco ⇄ Yjs after the editor mounts (and only in the browser)
  const handleMount = async (editor: import('monaco-editor').editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
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
    <ResizablePanels
      leftTitle="Code Editor"
      rightTitle="Drawing Board"
      defaultLeftWidth={65}
      leftPanel={
        <div className="h-full flex flex-col">
          <div className="p-4 flex justify-between items-center border-b border-gray-700 bg-gray-900">
            <div>
              <h2 className="text-lg font-semibold">Users in room:</h2>
              <ul>
                {users.map((user, i) => (
                  <li key={i} style={{ color: user.color }}>
                    {user.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                id="file-importer"
                style={{ display: 'none' }}
                onChange={handleFileImport}
                accept=".js,.ts,.tsx,.jsx,.html,.css,.json,.md,.txt,.py"
              />
              <Button onPress={handleImportClick}>Import</Button>
              <Button onPress={handleExport}>Export</Button>
              <Button onPress={handleInvite}>Invite</Button>
            </div>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
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
        </div>
      }
      rightPanel={<DrawingBoard roomId={roomId} />}
    />
  );
}
