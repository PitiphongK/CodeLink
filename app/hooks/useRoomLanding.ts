'use client'
import { useEffect, useState } from 'react'

import { addToast } from '@heroui/toast'
import { useRouter, useSearchParams } from 'next/navigation'

import type { RoomEntryStep } from '@/app/interfaces/types'
import { generateRandomUserName } from '@/app/utils/randomName'
import { formatRoomCodeInput, normalizeRoomCode } from '@/app/utils/roomCode'

function readErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const error = (value as { error?: unknown }).error
  return typeof error === 'string' ? error : null
}

function readRoomId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const room = (value as { room?: unknown }).room
  if (!room || typeof room !== 'object') return null
  const id = (room as { id?: unknown }).id
  return typeof id === 'string' && id ? id : null
}

export function useRoomLanding() {
  const [joinRoomId, setJoinRoomId] = useState('')
  const [userName, setUserName] = useState('')
  const [step, setStep] = useState<RoomEntryStep>('initial')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const storedUserName = sessionStorage.getItem('userName')
    if (storedUserName) {
      setUserName(storedUserName)
    } else {
      setUserName(generateRandomUserName())
    }
    const joinId = searchParams?.get('join')
    if (joinId) {
      setJoinRoomId(formatRoomCodeInput(joinId))
      if (!storedUserName) {
        setStep('join-name')
      }
    }
  }, [searchParams])

  const handleJoinRoom = () => {
    setIsSubmitting(true)
    const name = userName.trim()
    const normalized = normalizeRoomCode(joinRoomId)
    if (!name) {
      addToast({
        title: 'Name required',
        description: 'Please enter your name to join the room.',
        color: 'warning',
        variant: 'solid',
        timeout: 4000,
      })
      setIsSubmitting(false)
      return
    }
    if (!normalized) {
      addToast({
        title: 'Invalid room code',
        description: 'Please use format XXX-XXX-XXX.',
        color: 'danger',
        variant: 'solid',
        timeout: 4000,
      })
      setIsSubmitting(false)
      return
    }
    sessionStorage.setItem('userName', name)
    router.push(`/rooms/${normalized}`)
  }

  const handleCreateRoom = async () => {
    console.log('Creating room...')
    setIsSubmitting(true)
    const name = userName.trim()
    if (!name) {
      addToast({
        title: 'Name required',
        description: 'Please enter your name to create a room.',
        color: 'warning',
        variant: 'solid',
        timeout: 4000,
      })
      setIsSubmitting(false)
      return
    }
    sessionStorage.setItem('userName', name)

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // No id => server generates + reserves a unique code.
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => null)
        addToast({
          title: 'Failed to create room',
          description: readErrorMessage(errorData) || 'Please try again.',
          color: 'danger',
          variant: 'solid',
          timeout: 5000,
        })
        setIsSubmitting(false)
        return
      }

      const data: unknown = await response.json().catch(() => null)
      const roomId = readRoomId(data)
      if (!roomId) {
        addToast({
          title: 'Failed to create room',
          description:
            'Server returned an invalid room code. Please try again.',
          color: 'danger',
          variant: 'solid',
          timeout: 5000,
        })
        setIsSubmitting(false)
        return
      }

      router.push(`/rooms/${roomId}`)
    } catch (error) {
      console.error('Error creating room:', error)
      addToast({
        title: 'Network error',
        description: 'Please try again.',
        color: 'danger',
        variant: 'solid',
        timeout: 5000,
      })
      setIsSubmitting(false)
    }
  }

  const isExistingRoom = async (roomId: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/rooms?id=${roomId}`)
      if (!response.ok) return false
      const data = await response.json()
      return !!data.room
    } catch (error) {
      console.error('Error checking room existence:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    joinRoomId,
    setJoinRoomId,
    userName,
    setUserName,
    step,
    setStep,
    handleJoinRoom,
    handleCreateRoom,
    isSubmitting,
    isExistingRoom,
  } as const
}
