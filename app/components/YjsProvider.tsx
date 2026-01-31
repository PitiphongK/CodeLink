import { createContext, useContext } from 'react';
import { type YjsInstance } from '@/app/interfaces/yjs'
import { useYjs } from '@/app/hooks/useYjs';

const YjsContext = createContext<YjsInstance | null>(null)

type YjsProviderProps = {
  roomId: string
  children: React.ReactNode
}

export function YjsProvider({ roomId, children }: YjsProviderProps) {
  const yjsInstance = useYjs(roomId)

  if (!yjsInstance) {
    return <div>Loading...</div> // TODO: better loader
  }

  return (
    <YjsContext.Provider value={yjsInstance}>{children}</YjsContext.Provider>
  )
}

export function useYjsContext() {
  const context = useContext(YjsContext)
  if (!context) {
    throw new Error('useYjsContext must be used within a YjsProvider')
  }
  return context
}