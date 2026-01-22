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
import RolesModal from '@/app/components/modals/RolesModal';
import SettingsModal from '@/app/components/modals/SettingsModal';
import EndSessionConfirmModal from '@/app/components/modals/EndSessionConfirmModal';
import SessionSummaryModal from '@/app/components/modals/SessionSummaryModal';
import SessionEndedModal from '@/app/components/modals/SessionEndedModal';
import RoleNoticeModal from '@/app/components/modals/RoleNoticeModal';
import GitHubImportModal from '@/app/components/modals/GitHubImportModal';
import SharedTerminal, { type SharedTerminalHandle } from '@/app/components/SharedTerminal';
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
  const analyticsMapRef = useRef<Y.Map<unknown> | null>(null);
  const [userStates, setUserStates] = useState<AwarenessEntry[]>([]);
  const [language, setLanguage] = useState<Languages>(Languages.JAVASCRIPT);
  const [following, setFollowing] = useState<string | null>(null);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const isOwnerRef = useRef(false);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const ownerInitRef = useRef(false);
  const lastOwnerIdRef = useRef<number | null>(null);
  const [providerSynced, setProviderSynced] = useState(false);
  const [myRole, setMyRole] = useState<AwarenessRole>('none');
  const myRoleRef = useRef<AwarenessRole>('none');
  const roleNoticeShownRef = useRef(false);
  const [roleNoticeOpen, setRoleNoticeOpen] = useState(false);
  const [hideRoleNotice, setHideRoleNotice] = useState(false);
  const [roleNoticeDontShowAgain, setRoleNoticeDontShowAgain] = useState(false);
  const sessionStartRef = useRef<number | null>(null);
  const roleSinceRef = useRef<{ role: AwarenessRole; startedAt: number } | null>(null);
  const roleTotalsRef = useRef<{ driver: number; navigator: number; none: number }>({
    driver: 0,
    navigator: 0,
    none: 0,
  });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{
    sessionMs: number;
    driverMs: number;
    navigatorMs: number;
    noneMs: number;
  } | null>(null);
  const [teamRoleContribution, setTeamRoleContribution] = useState<
    Array<{
      clientId: number;
      name: string;
      driverMs: number;
      navigatorMs: number;
      noneMs: number;
    }>
  >([]);
  const [overlayActive, setOverlayActive] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser'>('pen');
  const [hLayout, setHLayout] = useState<number[] | null>(null);
  const [vLayout, setVLayout] = useState<number[] | null>(null);
  const hGroupRef = useRef<ImperativePanelGroupHandle | null>(null);
  const vGroupRef = useRef<ImperativePanelGroupHandle | null>(null);
  const layoutDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [roomReady, setRoomReady] = useState(false);
  const [sessionEndedOpen, setSessionEndedOpen] = useState(false);
  const [githubImportOpen, setGithubImportOpen] = useState(false);

  // Memoize the awareness update function to prevent infinite loops
  const updateUsersRef = useRef<(() => void) | undefined>(undefined);

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
    
    updateUsersRef.current = updateUsers;

    provider.awareness.on('change', updateUsers);
    updateUsers(); // Initial update

    if (editorRef.current) {
      editorRef.current.onDidScrollChange(handleEditorScroll);
    }

    // roles shared map
    const rolesMap = ydoc.getMap<AwarenessRole>('roles');
    rolesMapRef.current = rolesMap;

    // analytics shared map: each client writes their own timing totals
    const analyticsMap = ydoc.getMap<unknown>('analytics');
    analyticsMapRef.current = analyticsMap;

    // Determine and persist room owner (first starter becomes owner)
    const roomMap = ydoc.getMap<unknown>('room');
    roomMapRef.current = roomMap;
    setRoomReady(true);
    const currentId = provider.awareness.clientID;
    // Wait for initial sync before electing or reading owner
    const syncedHandler = (isSynced: boolean) => {
      if (!isSynced) return;
      setProviderSynced(true);

      // Start the local timer once, after initial sync.
      if (sessionStartRef.current == null) {
        sessionStartRef.current = Date.now();
        roleSinceRef.current = { role: myRoleRef.current, startedAt: sessionStartRef.current };
      }

      if (ownerInitRef.current) return;
      ownerInitRef.current = true;
      const existingOwner = roomMap.get('owner');
      if (existingOwner == null) {
        const candidates = Array.from(provider.awareness.getStates().keys()) as number[];
        const arbiter = candidates.length > 0 ? Math.min(...candidates) : currentId;
        if (currentId === arbiter) {
          roomMap.set('owner', arbiter);
        }
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
      const defaultV = [60, 40];
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
      const fromMap = rolesMap.get(selfId.toString());
      const role: AwarenessRole = fromMap ?? (isOwnerRef.current ? 'driver' : 'navigator');
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
      provider.awareness.off('change', updateUsersRef.current || updateUsers);
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

      // Reset local analytics.
      sessionStartRef.current = null;
      roleSinceRef.current = null;
      roleTotalsRef.current = { driver: 0, navigator: 0, none: 0 };
      analyticsMapRef.current = null;
      updateUsersRef.current = undefined;
      setRoomReady(false);
      setProviderSynced(false);
      ownerInitRef.current = false;
    };
  }, [roomId]);

  // If the room is marked as destroyed (ended by host), kick non-owners back to home.
  useEffect(() => {
    if (!roomReady) return;
    const roomMap = roomMapRef.current;
    if (!roomMap) return;

    const onRoomChange = () => {
      const destroyed = roomMap.get('destroyed');
      if (destroyed !== true) return;

      // Host stays to see analytics; everyone else leaves.
      if (isOwner) return;

      setSessionEndedOpen(true);
    };

    roomMap.observe(onRoomChange);
    onRoomChange();
    return () => {
      roomMap.unobserve(onRoomChange);
    };
  }, [isOwner, roomReady]);

  // Keep an always-fresh owner value for callbacks created during initial mount.
  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

  // Keep an always-fresh role value for callbacks that shouldn't depend on myRole.
  useEffect(() => {
    myRoleRef.current = myRole;
  }, [myRole]);

  // Load persisted preference for role notice.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('codelink:hideRoleNotice');
      setHideRoleNotice(raw === '1');
    } catch {
      setHideRoleNotice(false);
    }
  }, []);

  // Show role notice once per session when the role is known.
  useEffect(() => {
    if (!providerSynced) return;
    if (hideRoleNotice) return;
    if (roleNoticeShownRef.current) return;

    if (myRole === 'driver' || myRole === 'navigator') {
      roleNoticeShownRef.current = true;
      setRoleNoticeDontShowAgain(false);
      setRoleNoticeOpen(true);
    }
  }, [hideRoleNotice, myRole, providerSynced]);

  // Track time spent in each role (for the current user).
  useEffect(() => {
    const now = Date.now();
    const start = sessionStartRef.current;

    if (start == null) {
      // We'll initialize once the session start is known.
      return;
    }

    const current = roleSinceRef.current;
    if (!current) {
      roleSinceRef.current = { role: myRole, startedAt: now };
      return;
    }

    if (current.role === myRole) return;

    const delta = Math.max(0, now - current.startedAt);
    if (current.role === 'driver') roleTotalsRef.current.driver += delta;
    else if (current.role === 'navigator') roleTotalsRef.current.navigator += delta;
    else roleTotalsRef.current.none += delta;

    roleSinceRef.current = { role: myRole, startedAt: now };
  }, [myRole]);

  const publishMyRoleTotals = useCallback((now: number) => {
    const provider = providerRef.current;
    const analyticsMap = analyticsMapRef.current;
    if (!provider || !analyticsMap) return;

    const startedAt = sessionStartRef.current;
    if (startedAt == null) return;

    // Compute totals including current in-progress segment.
    const current = roleSinceRef.current;
    const base = roleTotalsRef.current;
    const totals = {
      driver: base.driver,
      navigator: base.navigator,
      none: base.none,
    };

    if (current) {
      const delta = Math.max(0, now - current.startedAt);
      if (current.role === 'driver') totals.driver += delta;
      else if (current.role === 'navigator') totals.navigator += delta;
      else totals.none += delta;
    }

    const selfIdStr = provider.awareness.clientID.toString();
    analyticsMap.set(selfIdStr, {
      driverMs: totals.driver,
      navigatorMs: totals.navigator,
      noneMs: totals.none,
    });
  }, []);

  const computeSessionSummaryNow = useCallback((now: number) => {
    const startedAt = sessionStartRef.current;
    if (startedAt == null) return null;

    // Base totals + current segment
    const base = roleTotalsRef.current;
    const totals = {
      driver: base.driver,
      navigator: base.navigator,
      none: base.none,
    };

    const current = roleSinceRef.current;
    if (current) {
      const delta = Math.max(0, now - current.startedAt);
      if (current.role === 'driver') totals.driver += delta;
      else if (current.role === 'navigator') totals.navigator += delta;
      else totals.none += delta;
    }

    return {
      sessionMs: Math.max(0, now - startedAt),
      driverMs: totals.driver,
      navigatorMs: totals.navigator,
      noneMs: totals.none,
    };
  }, []);

  const computeTeamContributionNow = useCallback(() => {
    const analyticsMap = analyticsMapRef.current;
    const byId = new Map<string, { driverMs: number; navigatorMs: number; noneMs: number }>();

    if (analyticsMap) {
      for (const [k, v] of analyticsMap.entries()) {
        if (typeof k !== 'string') continue;
        const obj: Record<string, unknown> =
          v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
        const driverMs = typeof obj.driverMs === 'number' ? obj.driverMs : 0;
        const navigatorMs = typeof obj.navigatorMs === 'number' ? obj.navigatorMs : 0;
        const noneMs = typeof obj.noneMs === 'number' ? obj.noneMs : 0;
        byId.set(k, { driverMs, navigatorMs, noneMs });
      }
    }

    return userStates
      .map(([clientId, state]) => {
        const totals = byId.get(clientId.toString()) ?? { driverMs: 0, navigatorMs: 0, noneMs: 0 };
        return {
          clientId,
          name: state.user?.name ?? `User ${clientId}`,
          ...totals,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [userStates]);

  const handleOpenAnalytics = useCallback(() => {
    const now = Date.now();
    publishMyRoleTotals(now);

    const summary = computeSessionSummaryNow(now);
    setSessionSummary(summary);
    setTeamRoleContribution(computeTeamContributionNow());
    setAnalyticsOpen(true);
  }, [computeSessionSummaryNow, computeTeamContributionNow, publishMyRoleTotals]);

  // Periodically publish so other clients (and the owner) can read up-to-date totals.
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      publishMyRoleTotals(now);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [publishMyRoleTotals]);

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
    const role = rolesMap.get(selfId.toString()) ?? (isOwnerRef.current ? 'driver' : 'navigator');

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

  // Auto-assign roles: owner is driver, everyone else is navigator.
  // The current owner is the only client allowed to write roles.
  useEffect(() => {
    if (!providerSynced) return;

    const provider = providerRef.current;
    const roomMap = roomMapRef.current;
    const rolesMap = rolesMapRef.current;
    if (!provider || !roomMap || !rolesMap) return;

    if (roomMap.get('destroyed') === true) return;

    const currentOwner = ownerId;
    if (currentOwner == null) return;

    const selfId = provider.awareness.clientID;
    if (selfId !== currentOwner) return;

    const presentIds = Array.from(provider.awareness.getStates().keys()) as number[];

    // Demote previous owner if ownership changed and they are still present.
    const prevOwner = lastOwnerIdRef.current;
    if (prevOwner != null && prevOwner !== currentOwner && presentIds.includes(prevOwner)) {
      rolesMap.set(prevOwner.toString(), 'navigator');
    }

    rolesMap.set(currentOwner.toString(), 'driver');

    for (const cid of presentIds) {
      if (cid === currentOwner) continue;
      rolesMap.set(cid.toString(), 'navigator');
    }

    lastOwnerIdRef.current = currentOwner;
  }, [ownerId, providerSynced]);

  // Ensure an owner exists; if missing or left, pick a random present user.
  useEffect(() => {
    const provider = providerRef.current;
    const roomMap = roomMapRef.current;
    if (!provider || !roomMap) return;
    if (!providerSynced) return;

    const destroyed = roomMap.get('destroyed');
    if (destroyed === true) return;

    const states = Array.from(provider.awareness.getStates().keys());
    const presentIds = new Set<number>(states as number[]);

    const currentOwner = roomMap.get('owner');
    const ownerMissing = currentOwner == null;
    const ownerLeft = typeof currentOwner === 'number' && !presentIds.has(currentOwner);
    if (ownerMissing || ownerLeft) {
      if (presentIds.size > 0) {
        const candidates = Array.from(presentIds);
        // Deterministic arbitration: only the smallest clientId writes,
        // and the owner is always elected as that smallest id.
        const arbiter = Math.min(...candidates);
        const selfId = provider.awareness.clientID;
        if (selfId === arbiter) {
          roomMap.set('owner', arbiter);
        }
      } else {
        // No users left - mark destroyed for cleanup
        roomMap.set('destroyed', true);
      }
    }
  }, [providerSynced]);

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

  const handleEndSession = useCallback(async () => {
    if (!isOwner) return;

    if (endingSession) return;
    setEndingSession(true);

    let endedAt: number | null = null;

    try {
      const res = await fetch(`/api/rooms?id=${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      endedAt = Date.now();
      roomMapRef.current?.set('destroyed', true);
      roomMapRef.current?.set('destroyedAt', endedAt);

      addToast({
        title: 'Session ended',
        description: 'Room has been closed.',
        color: 'success',
        variant: 'solid',
        timeout: 2500,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      addToast({
        title: 'Could not end session',
        description: message,
        color: 'danger',
        variant: 'solid',
        timeout: 4000,
      });
      setEndingSession(false);
      return;
    }

    // Finalize local role totals and show analytics.
    if (endedAt === null) endedAt = Date.now();
    publishMyRoleTotals(endedAt);
    const startedAt = sessionStartRef.current ?? endedAt;
    const current = roleSinceRef.current;
    if (current) {
      const delta = Math.max(0, endedAt - current.startedAt);
      if (current.role === 'driver') roleTotalsRef.current.driver += delta;
      else if (current.role === 'navigator') roleTotalsRef.current.navigator += delta;
      else roleTotalsRef.current.none += delta;
      roleSinceRef.current = { role: current.role, startedAt: endedAt };
    }

    setSessionSummary({
      sessionMs: Math.max(0, endedAt - startedAt),
      driverMs: roleTotalsRef.current.driver,
      navigatorMs: roleTotalsRef.current.navigator,
      noneMs: roleTotalsRef.current.none,
    });

    // Build per-user contribution list from shared analytics.
    const analyticsMap = analyticsMapRef.current;
    const byId = new Map<string, { driverMs: number; navigatorMs: number; noneMs: number }>();
    if (analyticsMap) {
      for (const [k, v] of analyticsMap.entries()) {
        if (typeof k !== 'string') continue;
        const obj: Record<string, unknown> =
          v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
        const driverMs = typeof obj.driverMs === 'number' ? obj.driverMs : 0;
        const navigatorMs = typeof obj.navigatorMs === 'number' ? obj.navigatorMs : 0;
        const noneMs = typeof obj.noneMs === 'number' ? obj.noneMs : 0;
        byId.set(k, { driverMs, navigatorMs, noneMs });
      }
    }

    const users = userStates
      .map(([clientId, state]) => {
        const totals = byId.get(clientId.toString()) ?? { driverMs: 0, navigatorMs: 0, noneMs: 0 };
        return {
          clientId,
          name: state.user?.name ?? `User ${clientId}`,
          ...totals,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    setTeamRoleContribution(users);

    setSummaryOpen(true);
    setEndingSession(false);
  }, [endingSession, isOwner, publishMyRoleTotals, roomId, userStates]);

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

  const handleGitHubImport = useCallback(async (repoUrl: string, filePath?: string) => {
    try {
      const response = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, filePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import from GitHub');
      }

      const data = await response.json();

      if (data.type === 'file' && editorRef.current) {
        editorRef.current.setValue(data.content);
        
        addToast({
          title: 'Import successful',
          description: `Imported ${data.filename} from GitHub`,
          color: 'success',
          variant: 'solid',
          timeout: 3000,
        });
      } else if (data.type === 'list') {
        addToast({
          title: 'Choose a file',
          description: 'Please specify a file path in the repository',
          color: 'warning',
          variant: 'solid',
          timeout: 4000,
        });
      }
    } catch (error) {
      console.error('GitHub import error:', error);
      throw error;
    }
  }, []);

  // Run code on the server and show output
  const [running, setRunning] = useState(false);
  const terminalRef = useRef<SharedTerminalHandle | null>(null);

  const handleRun = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    setRunning(true);
    try {
      terminalRef.current?.clear();
      terminalRef.current?.run({ language, code });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      terminalRef.current?.write(`\r\n[run error: ${message}]\r\n`);
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

  const handleHLayoutChange = useCallback((sizes: number[]) => {
    setHLayout(sizes);
    if (myRole === 'driver') {
      if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current);
      layoutDebounceRef.current = setTimeout(() => {
        panelsMapRef.current?.set('h', sizes);
      }, 300);
    }
  }, [myRole]);

  const handleVLayoutChange = useCallback((sizes: number[]) => {
    setVLayout(sizes);
    if (myRole === 'driver') {
      if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current);
      layoutDebounceRef.current = setTimeout(() => {
        panelsMapRef.current?.set('v', sizes);
      }, 300);
    }
  }, [myRole]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <RoleNoticeModal
        isOpen={roleNoticeOpen}
        role={myRole === 'driver' ? 'driver' : 'navigator'}
        dontShowAgain={roleNoticeDontShowAgain}
        onChangeDontShowAgain={setRoleNoticeDontShowAgain}
        onOk={() => {
          if (roleNoticeDontShowAgain) {
            try {
              localStorage.setItem('codelink:hideRoleNotice', '1');
            } catch {}
            setHideRoleNotice(true);
          }
          setRoleNoticeOpen(false);
        }}
      />
      <GitHubImportModal
        isOpen={githubImportOpen}
        onClose={() => setGithubImportOpen(false)}
        onImport={handleGitHubImport}
      />
      <SessionEndedModal
        isOpen={sessionEndedOpen}
        onGoHome={() => {
          window.location.href = '/';
        }}
      />
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
        onCopyLink={handleInvite}
      />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <EndSessionConfirmModal
        isOpen={endConfirmOpen}
        pending={endingSession}
        onCancel={() => setEndConfirmOpen(false)}
        onConfirm={async () => {
          await handleEndSession();
          // Close confirm once the session end flow finishes.
          setEndConfirmOpen(false);
        }}
      />
      <SessionSummaryModal
        isOpen={summaryOpen}
        summary={sessionSummary}
        users={teamRoleContribution}
        onClose={() => {
          setSummaryOpen(false);
          window.location.href = '/';
        }}
      />
      <SessionSummaryModal
        isOpen={analyticsOpen}
        summary={sessionSummary}
        users={teamRoleContribution}
        primaryActionLabel="Close"
        onClose={() => setAnalyticsOpen(false)}
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
        onGitHubImport={() => setGithubImportOpen(true)}
        users={userStates.filter(([clientId]) => clientId !== providerRef.current?.awareness.clientID)}
        onFollow={setFollowing}
        following={following}
        followingName={
          following
            ? (userStates.find(([cid]) => cid.toString() === following)?.[1].user?.name ?? null)
            : null
        }
        onManageRoles={() => setRolesOpen(true)}
        onOpenAnalytics={handleOpenAnalytics}
        onOpenSettings={() => setSettingsOpen(true)}
        onEndSession={() => setEndConfirmOpen(true)}
        onLeaveSession={() => {
          window.location.href = '/';
        }}
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
          onLayout={handleHLayoutChange}
        >
          <Panel collapsible={true} collapsedSize={0} minSize={10}>
            <PanelGroup
              ref={vGroupRef}
              direction="vertical"
              onLayout={handleVLayoutChange}
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
                minSize={10}
                className=" bg-[#1e1e1e] flex flex-col"
              >
                <div className="p-4 flex flex-col h-full">
                  <h3 className="text-sm font-medium">Terminal</h3>
                  <div className="mt-2 flex-1 min-h-0">
                    <SharedTerminal ref={terminalRef} roomId={roomId} />
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

