'use client';
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Toolbar from '@/app/components/Toolbar';
import DrawingBoard from "@/app/components/DrawingBoard";
import Editor from '@monaco-editor/react';
import { Languages, languageExtensions, languageOptions } from '@/app/interfaces/languages';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import EditorOverlayDrawing from '@/app/components/EditorOverlayDrawing';
import LiveCursor from '@/app/components/LiveCursor';

type Props = { roomId: string };

// simple helper
function randColor() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

export default function EditorClient({ roomId }: Props) {
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [userStates, setUserStates] = useState<any[]>([]);
  const [language, setLanguage] = useState<Languages>(Languages.JAVASCRIPT);
  const [following, setFollowing] = useState<string | null>(null);

  // Create/destroy Yjs doc + provider when room changes
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      'wss://demos.yjs.dev/ws',
      roomId,
      ydoc
    );

    const handleMouseMove = (event: MouseEvent) => {
      provider.awareness.setLocalStateField('cursor', {
        x: event.clientX,
        y: event.clientY,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleEditorScroll = () => {
      if (editorRef.current) {
        const scrollTop = editorRef.current.getScrollTop();
        provider.awareness.setLocalStateField('scroll', { top: scrollTop });
      }
    };

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().entries());
      setUserStates(states);
    };

    provider.awareness.on('change', updateUsers);
    updateUsers(); // Initial update

    if (editorRef.current) {
      editorRef.current.onDidScrollChange(handleEditorScroll);
    }

    // set presence
    const userName = sessionStorage.getItem('userName') || 'Anonymous';
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: randColor(),
    });

    ydocRef.current = ydoc;
    providerRef.current = provider;

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (editorRef.current) {
        // This is tricky because the editor instance might be gone.
        // A more robust solution would involve a cleanup function from the editor component itself.
      }
      provider.awareness.off('change', updateUsers);
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
    };
  }, [roomId]);

  // Effect to handle following a user's scroll position
  useEffect(() => {
    if (following) {
      const followedUser = userStates.find(([clientId]) => clientId.toString() === following);
      if (followedUser && followedUser[1].scroll && editorRef.current) {
        editorRef.current.setScrollTop(followedUser[1].scroll.top);
      }
    }
  }, [following, userStates]);

  const handleMount = async (editor: import('monaco-editor').editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    const ydoc = ydocRef.current!;
    const provider = providerRef.current!;
    const ytext = ydoc.getText('monaco');

    // Dynamically import y-monaco and create the binding
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

    // Set initial value if the document is empty
    if (ytext.length === 0) {
      ytext.insert(0, `// Room: ${roomId}\nfunction add(a, b) { return a + b }\n`);
    }
  };

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
      const fileExtension = languageExtensions[language] || '.txt';
      const content = editorRef.current.getValue();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codelink-room-${roomId}${fileExtension}`;
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

  // Run code on the server and show output
  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    setRunning(true);
    setRunOutput(null);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'python', code }),
      });
      const json = await res.json();
      const out = [] as string[];
      if (json.stdout) out.push(json.stdout);
      if (json.stderr) out.push('\n--- STDERR ---\n' + json.stderr);
      out.push(`\n(exit: ${json.exitCode ?? 'unknown'}${json.timedOut ? ', timed out' : ''})`);
      setRunOutput(out.join('\n'))
    } catch (err: any) {
      setRunOutput(String(err?.message ?? err))
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    const handleExportEvent = () => handleExport();
    window.addEventListener('toolbar:export', handleExportEvent);

    const fileInput = document.getElementById('toolbar-file-importer');
    const handleImportChange = (e: Event) => handleFileImport(e as unknown as React.ChangeEvent<HTMLInputElement>);

    fileInput?.addEventListener('change', handleImportChange);

    return () => {
      window.removeEventListener('toolbar:export', handleExportEvent);
      fileInput?.removeEventListener('change', handleImportChange);
    }
  }, [language, following]);

  return (
    <div className="flex flex-col h-full">
      {userStates
        .filter(([clientId]) => clientId !== providerRef.current?.awareness.clientID)
        .map(([clientId, state]) => {
        if (state.cursor && state.user) {
          return (
            <LiveCursor
              key={clientId}
              x={state.cursor.x}
              y={state.cursor.y}
              color={state.user.color}
              name={state.user.name}
            />
          );
        }
        return null;
      })}
      <Toolbar
        onRun={handleRun}
        running={running}
        onInvite={handleInvite}
        onImport={handleFileImport}
        onExport={handleExport}
        users={userStates.filter(([clientId]) => clientId !== providerRef.current?.awareness.clientID)}
        onFollow={setFollowing}
        following={following}
      />
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel collapsible={true} collapsedSize={0} minSize={10}>
            <PanelGroup direction="vertical">
              <Panel>
                <div className="flex-1 relative h-full">
                  <Editor
                    height="100%"
                    language={language}
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
                  <EditorOverlayDrawing ydoc={ydocRef.current} />
                  <div className='absolute bottom-4 right-4 z-10'>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button className="capitalize" variant="bordered">
                          {language}
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        disallowEmptySelection
                        aria-label="Language selection"
                        selectedKeys={[language]}
                        selectionMode="single"
                        variant="flat"
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as Languages;
                          setLanguage(selected);
                        }}
                      >
                        {(languageOptions.map((option) => (
                          <DropdownItem key={option.value}>{option.label}</DropdownItem>
                        )) as unknown as any)}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="h-[3px] bg-[#404040] flex justify-center items-center transition-colors duration-[250ms] ease-linear hover:bg-blue-400 [&[data-resize-handle-active]]:bg-blue-400"/>
              <Panel
                collapsible={true}
                collapsedSize={0}
                defaultSize={20}
                minSize={10}
                className=" bg-[#1e1e1e] flex flex-col"
              >
                <div className="p-4 ">
                  <h3 className="text-sm font-medium">Terminal</h3>
                  <div className="mt-2 text-white rounded flex-1 overflow-auto whitespace-pre-wrap font-mono text-xs">
                    {runOutput ?? (
                      <span className="text-gray-400">
                        Press Run to execute Python code (server-side).
                      </span>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="w-[3px] bg-[#1e1e1e] flex justify-center items-center transition-colors duration-[250ms] ease-linear hover:bg-blue-400 [&[data-resize-handle-active]]:bg-blue-400"/>
          <Panel collapsible={true} collapsedSize={0} minSize={10}>
            <DrawingBoard ydoc={ydocRef.current} />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

