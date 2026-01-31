'use client'

import { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { YjsProvider } from '@/app/components/YjsProvider'

const EditorClient = dynamic(() => import('../../components/EditorClient'), { ssr: false })

type Props = {
  id: string
}

export default function RoomPageClient({ id }: Props) {
  const router = useRouter()
  const [hasUserName, setHasUserName] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const storedName = sessionStorage.getItem('userName')
      if (!storedName) {
        setHasUserName(false)
        router.replace(`/?join=${encodeURIComponent(id)}`)
      } else {
        setHasUserName(true)
      }
    } catch {
      // sessionStorage not available (shouldn't happen in client); ignore
    }
  }, [id, router])

  if (hasUserName !== true) {
    return <main className="flex flex-col h-screen overflow-hidden" />
  }

  return (
    <YjsProvider roomId={id}>
      <main className="flex flex-col h-screen overflow-hidden">
        <EditorClient roomId={id} />
      </main>
    </YjsProvider>
  )
}
