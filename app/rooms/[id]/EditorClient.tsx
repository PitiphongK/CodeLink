'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Toolbar from '@/app/components/Toolbar';
import DrawingBoard from "@/app/components/DrawingBoard";
import Editor from '@monaco-editor/react';
import { Languages, languageExtensions, languageOptions } from '@/app/interfaces/languages';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelGroupHandle } from 'react-resizable-panels';
import { useMonacoFollowScroll } from '@/app/hooks/useMonacoFollowScroll';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import EditorOverlayDrawing from '@/app/components/EditorOverlayDrawing';
import LiveCursor from '@/app/components/LiveCursor';
import RolesModal from '@/app/components/RolesModal';
import type { AwarenessRole, AwarenessState } from '@/app/interfaces/awareness';
import { addToast } from '@heroui/toast';

type Props = { roomId: string };

type AwarenessEntry = [number, AwarenessState];

type ProviderWithSyncedEvents = {
  on: (event: 'synced', cb: (isSynced: boolean) => void) => void;
  off?: (event: 'synced', cb: (isSynced: boolean) => void) => void;
};

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((n) => typeof n === 'number');
}

// simple helper
function randColor() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

export default function EditorClient({ roomId }: Props) {
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const rolesMapRef = useRef<Y.Map<AwarenessRole> | null>(null);
  const roomMapRef = useRef<Y.Map<unknown> | null>(null);
  const panelsMapRef = useRef<Y.Map<unknown> | null>(null);
  const [userStates, setUserStates] = useState<AwarenessEntry[]>([]);
  const [language, setLanguage] = useState<Languages>(Languages.JAVASCRIPT);
  const [following, setFollowing] = useState<string | null>(null);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const ownerInitRef = useRef(false);
  const [myRole, setMyRole] = useState<AwarenessRole>('none');
  const [overlayActive, setOverlayActive] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser'>('pen');
  const [hLayout, setHLayout] = useState<number[] | null>(null);
  const [vLayout, setVLayout] = useState<number[] | null>(null);
  const hGroupRef = useRef<ImperativePanelGroupHandle | null>(null);
  const vGroupRef = useRef<ImperativePanelGroupHandle | null>(null);

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
      const states = Array.from(provider.awareness.getStates().entries()) as AwarenessEntry[];
      setUserStates(states);
    };

    provider.awareness.on('change', updateUsers);
    updateUsers(); // Initial update

    if (editorRef.current) {
      editorRef.current.onDidScrollChange(handleEditorScroll);
    }

    // roles shared map
    const rolesMap = ydoc.getMap<AwarenessRole>('roles');
    rolesMapRef.current = rolesMap;

    // Determine and persist room owner (first starter becomes owner)
    const roomMap = ydoc.getMap<unknown>('room');
    roomMapRef.current = roomMap;
    const currentId = provider.awareness.clientID;
    // Wait for initial sync before electing or reading owner
    const syncedHandler = (isSynced: boolean) => {
      if (!isSynced || ownerInitRef.current) return;
      ownerInitRef.current = true;
      const existingOwner = roomMap.get('owner');
      if (existingOwner == null) {
        roomMap.set('owner', currentId);
      }
      const owner = roomMap.get('owner');
      setOwnerId(typeof owner === 'number' ? owner : null);
      setIsOwner(owner === currentId);
    };
    // y-websocket emits 'synced' when initial doc sync completes
    const providerEvents = provider as unknown as ProviderWithSyncedEvents;
    providerEvents.on('synced', syncedHandler);
    // keep owner state in sync if room owner changes
    const roomObserver = () => {
      const owner = roomMap.get('owner');
      setOwnerId(typeof owner === 'number' ? owner : null);
      setIsOwner(owner === currentId);
    };
    roomMap.observe(roomObserver);

    // panels shared map for syncing layout across participants
    const panelsMap = ydoc.getMap<unknown>('panels');
    panelsMapRef.current = panelsMap;

    const ensurePanelDefaults = () => {
      // Initialize defaults if not present
      const hasH = isNumberArray(panelsMap.get('h'));
      const hasV = isNumberArray(panelsMap.get('v'));
      const defaultH = [50, 50];
      const defaultV = [80, 20];
      if (!hasH) panelsMap.set('h', defaultH);
      if (!hasV) panelsMap.set('v', defaultV);
      // Also seed local state so UI renders with values
      const h = panelsMap.get('h');
      const v = panelsMap.get('v');
      setHLayout(isNumberArray(h) ? h : defaultH);
      setVLayout(isNumberArray(v) ? v : defaultV);
    };

    const panelsObserver = () => {
      const h = panelsMap.get('h');
      const v = panelsMap.get('v');
      if (isNumberArray(h)) setHLayout(h.slice());
      if (isNumberArray(v)) setVLayout(v.slice());
    };
    panelsMap.observe(panelsObserver);

    // After initial sync, seed defaults if needed
    const panelsSyncedHandler = (isSynced: boolean) => {
      if (!isSynced) return;
      ensurePanelDefaults();
    };
    providerEvents.on('synced', panelsSyncedHandler);

    // keep my role in sync
    const rolesObserver = () => {
      const selfId = provider.awareness.clientID;
      const role = rolesMap.get(selfId.toString()) ?? 'none';
      setMyRole(role);
    };
    rolesMap.observe(rolesObserver);
    rolesObserver();

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
      roomMapRef.current?.unobserve(roomObserver);
      panelsMapRef.current?.unobserve(panelsObserver);
      rolesMapRef.current?.unobserve(rolesObserver);
      try {
        providerEvents.off?.('synced', syncedHandler);
        providerEvents.off?.('synced', panelsSyncedHandler);
      } catch {}
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
    };
  }, [roomId]);

  // Robust follow scroll via awareness client IDs
  useMonacoFollowScroll({
    editor: editorRef.current,
    awareness: providerRef.current?.awareness ?? null,
    followTargetClientId: following ? Number(following) : null,
    onTargetGone: () => setFollowing(null),
  });

  // Enforce roles: driver can edit, navigator is read-only and auto-follows driver
  useEffect(() => {
    const editor = editorRef.current;
    const awareness = providerRef.current?.awareness;
    const rolesMap = rolesMapRef.current;
    if (!editor || !awareness || !rolesMap) return;

    const selfId = awareness.clientID;
    const role = rolesMap.get(selfId.toString()) ?? 'none';

    // Set readOnly for navigators
    const isNavigator = role === 'navigator';
    editor.updateOptions({ readOnly: isNavigator });

    // Find current driver and follow if navigator
    if (isNavigator) {
      // Find first driver among known users
      const states = userStates;
      const driverEntry = states.find(([cid]) => rolesMap.get(cid.toString()) === 'driver');
      if (driverEntry) {
        const driverIdStr = driverEntry[0].toString();
        if (following !== driverIdStr) setFollowing(driverIdStr);
      }
    } else {
      // If not navigator and currently following, stop following
      if (following) setFollowing(null);
    }
  }, [userStates, following]);

  // Ensure an owner exists; if missing or left, pick a random present user.
  useEffect(() => {
    const provider = providerRef.current;
    const roomMap = roomMapRef.current;
    if (!provider || !roomMap) return;

    const states = Array.from(provider.awareness.getStates().keys());
    const presentIds = new Set<number>(states as number[]);

    const currentOwner = roomMap.get('owner');
    const ownerMissing = currentOwner == null;
    const ownerLeft = typeof currentOwner === 'number' && !presentIds.has(currentOwner);
    if (ownerMissing || ownerLeft) {
      if (presentIds.size > 0) {
        const candidates = Array.from(presentIds);
        const randomIdx = Math.floor(Math.random() * candidates.length);
        const chosen = candidates[randomIdx];
        // Deterministic arbitration: only the smallest clientId writes
        const arbiter = Math.min(...candidates);
        const selfId = provider.awareness.clientID;
        if (selfId === arbiter) {
          roomMap.set('owner', chosen);
        }
      } else {
        // No users left - mark destroyed for cleanup
        roomMap.set('destroyed', true);
      }
    }
  }, [userStates, ownerId]);

  // Proactive ownership handoff on tab close and destroy when last user leaves
  useEffect(() => {
    const pagehideOptions: AddEventListenerOptions = { capture: true };
    const handleOwnerExit = () => {
      const provider = providerRef.current;
      const rolesMap = rolesMapRef.current;
      const roomMap = roomMapRef.current;
      const panelsMap = panelsMapRef.current;
      if (!provider || !roomMap) return;
      const selfId = provider.awareness.clientID;
      const states = Array.from(provider.awareness.getStates().keys()) as number[];
      const presentIds = states.filter((cid) => cid !== selfId);
      const presentCountExcludingSelf = presentIds.length;

      if (!isOwner) return;

      if (presentCountExcludingSelf > 0) {
        // Proactively pick a random next owner among other participants
        const randomIdx = Math.floor(Math.random() * presentIds.length);
        const nextOwner = presentIds[randomIdx];
        try {
          roomMap.set('owner', nextOwner);
        } catch {}
      } else {
        // Owner is last user: mark destroyed and clear ephemeral maps
        try {
          roomMap.set('destroyed', true);
          if (rolesMap) {
            for (const k of Array.from(rolesMap.keys())) {
              rolesMap.delete(k);
            }
          }
          if (panelsMap) {
            for (const k of Array.from(panelsMap.keys())) {
              panelsMap.delete(k);
            }
          }
        } catch {}
      }
    };

    // Use both pagehide and beforeunload for broader browser coverage
    window.addEventListener('pagehide', handleOwnerExit, pagehideOptions);
    window.addEventListener('beforeunload', handleOwnerExit);
    return () => {
      window.removeEventListener('pagehide', handleOwnerExit, pagehideOptions);
      window.removeEventListener('beforeunload', handleOwnerExit);
    };
  }, [isOwner]);

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
      addToast({
        title: 'Invite link copied',
        description: 'Share it with your teammate to join.',
        color: 'success',
        variant: 'solid',
        timeout: 3000,
      });
    }, (err) => {
      console.error('Could not copy text: ', err);
      addToast({
        title: 'Copy failed',
        description: 'Could not copy invite link to clipboard.',
        color: 'danger',
        variant: 'solid',
        timeout: 4000,
      });
    });
  };

  const handleExport = useCallback(() => {
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
  }, [language, roomId]);

  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editorRef.current) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        editorRef.current?.setValue(content);
      };
      reader.readAsText(file);
    }
  }, [editorRef]);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setRunOutput(message)
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
  }, [handleExport, handleFileImport]);

  // Apply incoming layout updates to PanelGroups
  useEffect(() => {
    if (hLayout && hGroupRef.current) {
      try { hGroupRef.current.setLayout(hLayout); } catch {}
    }
  }, [hLayout]);
  useEffect(() => {
    if (vLayout && vGroupRef.current) {
      try { vGroupRef.current.setLayout(vLayout); } catch {}
    }
  }, [vLayout]);

  return (
    <div className="flex flex-col h-full">
      <RolesModal
        isOpen={rolesOpen}
        onClose={() => setRolesOpen(false)}
        isOwner={isOwner}
        users={userStates}
        getRole={(clientId) => rolesMapRef.current?.get(clientId.toString()) ?? 'none'}
        onSetRole={(clientId, role) => {
          if (!isOwner) return;
          rolesMapRef.current?.set(clientId.toString(), role);
        }}
        currentOwnerId={ownerId}
        onTransferOwner={(targetId) => {
          if (!isOwner) return;
          roomMapRef.current?.set('owner', targetId);
        }}
      />
      {userStates
        .filter(([clientId]) => clientId !== providerRef.current?.awareness.clientID)
        .map(([clientId, state]) => {
        if (state.cursor) {
          return (
            <LiveCursor
              key={clientId}
              x={state.cursor.x}
              y={state.cursor.y}
              color={state.user?.color ?? '#888'}
              name={state.user?.name ?? `User ${clientId}`}
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
        followingName={
          following
            ? (userStates.find(([cid]) => cid.toString() === following)?.[1].user?.name ?? null)
            : null
        }
        onManageRoles={() => setRolesOpen(true)}
        isOwner={isOwner}
        drawingTool={drawingTool}
        onChangeDrawingTool={setDrawingTool}
        overlayActive={overlayActive}
        onToggleOverlay={() => setOverlayActive((s) => !s)}
      />
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup
          ref={hGroupRef}
          direction="horizontal"
          onLayout={(sizes) => {
            // Only driver writes layout; others just observe
            if (myRole === 'driver') {
              panelsMapRef.current?.set('h', sizes);
            }
            setHLayout(sizes);
          }}
        >
          <Panel collapsible={true} collapsedSize={0} minSize={10}>
            <PanelGroup
              ref={vGroupRef}
              direction="vertical"
              onLayout={(sizes) => {
                if (myRole === 'driver') {
                  panelsMapRef.current?.set('v', sizes);
                }
                setVLayout(sizes);
              }}
            >
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
                  <EditorOverlayDrawing ydoc={ydocRef.current} active={overlayActive} tool={drawingTool} />
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
                        items={languageOptions}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as Languages;
                          setLanguage(selected);
                        }}
                      >
                        {(option) => (
                          <DropdownItem key={option.value}>{option.label}</DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle
                disabled={myRole === 'navigator'}
                className="h-[3px] bg-[#404040] flex justify-center items-center transition-colors duration-[250ms] ease-linear hover:bg-blue-400 [&[data-resize-handle-active]]:bg-blue-400"
              />
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
          <PanelResizeHandle
            disabled={myRole === 'navigator'}
            className="w-[3px] bg-[#1e1e1e] flex justify-center items-center transition-colors duration-[250ms] ease-linear hover:bg-blue-400 [&[data-resize-handle-active]]:bg-blue-400"
          />
          <Panel collapsible={true} collapsedSize={0} minSize={10}>
            <DrawingBoard ydoc={ydocRef.current} tool={drawingTool} />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

