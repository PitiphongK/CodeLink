export type AwarenessUser = { id?: string; name?: string; color?: string }
export type AwarenessScroll = { top: number; left: number; ts: number }
/** Normalized cursor position (0-1 range relative to viewport) */
export type AwarenessCursor = { x: number; y: number }
export type AwarenessRole = 'driver' | 'navigator'

export type AwarenessState = {
  user?: AwarenessUser
  scroll?: AwarenessScroll
  cursor?: AwarenessCursor
}
