export type AwarenessUser = { id?: string; name?: string; color?: string }
export type AwarenessScroll = { top: number; left: number; ts: number }
/** Normalized cursor position (0-1 range relative to viewport) */
export type AwarenessCursor = { x: number; y: number }
/** Monaco editor cursor position for follow-mode */
export type AwarenessEditorCursor = { lineNumber: number; column: number; ts: number }
export type AwarenessRole = 'driver' | 'navigator'

export type AwarenessState = {
  user?: AwarenessUser
  scroll?: AwarenessScroll
  cursor?: AwarenessCursor
  editorCursor?: AwarenessEditorCursor
}
