'use client'

import LiveCursor from '@/app/components/LiveCursor'
import type { AwarenessEntry } from '@/app/interfaces/editor'

interface LiveCursorsProps {
  /** List of user states with their awareness data */
  userStates: AwarenessEntry[]
  /** Current user's client ID to exclude from rendering */
  myClientId: number | undefined
}

/**
 * Renders live cursors for all connected users except the current user
 */
export default function LiveCursors({
  userStates,
  myClientId,
}: LiveCursorsProps) {
  return (
    <>
      {userStates
        .filter(([clientId]) => clientId !== myClientId)
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
            )
          }
          return null
        })}
    </>
  )
}
