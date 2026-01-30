'use client'

import { useEffect, useState } from 'react'
import { setupYjs } from '../y'

// Define a type for the Yjs instance for clarity
type YjsInstance = ReturnType<typeof setupYjs>

/**
 * A custom hook to manage the Yjs instance for a given room.
 * It handles the creation, caching, and cleanup of the Yjs connection.
 *
 * @param roomId - The ID of the room to connect to.
 */
export function useYjs(roomId: string) {
  const [yjs, setYjs] = useState<YjsInstance | null>(null)

  useEffect(() => {
    // Setup Yjs for the given room.
    // The `setupYjs` function handles caching, so we don't
    // need to worry about creating duplicate instances.
    const yjsInstance = setupYjs(roomId)
    setYjs(yjsInstance)

    // The cleanup function will be called when the component
    // that uses this hook unmounts.
    return () => {
      yjsInstance.destroy()
    }
  }, [roomId]) // Re-run the effect if the roomId changes

  return yjs
}
