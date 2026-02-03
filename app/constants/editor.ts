/**
 * Constants for the collaborative editor
 */

// ============================================================================
// WebSocket Configuration
// ============================================================================

/** Yjs WebSocket server URL */
export const YJS_WEBSOCKET_URL = 'wss://demos.yjs.dev/ws'

// ============================================================================
// Storage Keys
// ============================================================================

/** Keys for localStorage/sessionStorage */
export const STORAGE_KEYS = {
  /** Whether to hide the role notice modal */
  HIDE_ROLE_NOTICE: 'codelink:hideRoleNotice',
  /** User's display name */
  USER_NAME: 'userName',
} as const

// ============================================================================
// Timing Configuration
// ============================================================================

/** Interval (ms) for publishing analytics to other clients */
export const ANALYTICS_PUBLISH_INTERVAL_MS = 5000

/** Debounce delay (ms) for syncing layout changes */
export const LAYOUT_SYNC_DEBOUNCE_MS = 300

// ============================================================================
// Panel Layouts
// ============================================================================

/** Default horizontal panel sizes [left, right] as percentages */
export const DEFAULT_HORIZONTAL_LAYOUT = [50, 50] as const

/** Default vertical panel sizes [top, bottom] as percentages */
export const DEFAULT_VERTICAL_LAYOUT = [60, 40] as const

// ============================================================================
// Yjs Shared Document Keys
// ============================================================================

/** Keys for Yjs shared maps and text */
export const YJS_KEYS = {
  /** Monaco editor text content */
  MONACO_TEXT: 'monaco',
  /** User roles map */
  ROLES: 'roles',
  /** Room metadata map */
  ROOM: 'room',
  /** Panel layout map */
  PANELS: 'panels',
  /** Analytics data map */
  ANALYTICS: 'analytics',
} as const

/** Keys within the room map */
export const ROOM_MAP_KEYS = {
  OWNER: 'owner',
  LANGUAGE: 'language',
  DESTROYED: 'destroyed',
  DESTROYED_AT: 'destroyedAt',
} as const

/** Keys within the panels map */
export const PANELS_MAP_KEYS = {
  HORIZONTAL: 'h',
  VERTICAL: 'v',
} as const

// ============================================================================
// Editor Defaults
// ============================================================================

/** Default code template for new rooms */
export const getDefaultEditorContent = (roomId: string): string =>
  `// Room: ${roomId}\nfunction add(a, b) { return a + b }\n`

/** Monaco editor options */
export const MONACO_EDITOR_OPTIONS = {
  automaticLayout: true,
  minimap: { enabled: false },
  wordWrap: 'on' as const,
  scrollBeyondLastLine: false,
  fontSize: 14,
} as const
