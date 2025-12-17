export type AwarenessUser = { id?: string; name?: string; color?: string };
export type AwarenessScroll = { top: number; left: number; ts: number };
export type AwarenessCursor = { x: number; y: number };
export type AwarenessRole = 'driver' | 'navigator' | 'none';

export type AwarenessState = {
  user?: AwarenessUser;
  scroll?: AwarenessScroll;
  cursor?: AwarenessCursor;
};
