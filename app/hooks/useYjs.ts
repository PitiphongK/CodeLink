'use client'

import { useEffect, useState } from 'react'
import { setupYjs } from '../y'
import { YjsInstance } from '../interfaces/yjs'

export function useYjs(roomId: string) {
  const [yjs, setYjs] = useState<YjsInstance | null>(null)

  useEffect(() => {
    const yjsInstance = setupYjs(roomId)
    setYjs(yjsInstance)

    return () => {
      yjsInstance.destroy()
    }
  }, [roomId])

  return yjs
}
