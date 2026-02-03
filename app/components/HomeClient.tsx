'use client'

import { useEffect } from 'react'

import { Button, Form, Input, Spinner } from '@heroui/react'
import { addToast } from '@heroui/toast'
import { useRouter, useSearchParams } from 'next/navigation'

import { useRoomLanding } from '@/app/hooks/useRoomLanding'
import type { RoomEntryStep } from '@/app/interfaces/types'
import { generateRandomUserName } from '@/app/utils/randomName'
import { formatRoomCodeInput, normalizeRoomCode } from '@/app/utils/roomCode'

import { Logo } from './Logo'

export default function HomeClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams?.get('error')
    if (!error) return

    if (error === 'room-not-found') {
      addToast({
        title: 'Room not found',
        description: 'This room doesn’t exist (or was deleted).',
        color: 'danger',
        variant: 'solid',
        timeout: 4000,
      })
    } else if (error === 'invalid-room-code') {
      addToast({
        title: 'Invalid room code',
        description: 'Please check the code and try again.',
        color: 'danger',
        variant: 'solid',
        timeout: 4000,
      })
    }

    // Remove the error param so refresh/back doesn't re-toast.
    const next = new URLSearchParams(searchParams.toString())
    next.delete('error')
    const nextQuery = next.toString()
    router.replace(nextQuery ? `/?${nextQuery}` : '/')
  }, [router, searchParams])

  const {
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
  } = useRoomLanding()

  const renderInitial = () => (
    <>
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        {/* Join Section */}
        <div className="flex flex-col items-start p-6 w-full sm:w-1/2 rounded-lg">
          <h2 className="text-xl font-semibold mb-1">Join a room</h2>
          <p className="text-sm font-medium mb-4 text-gray-500">
            Join an existing session
          </p>

          <Form
            className="w-full"
            onSubmit={async (e) => {
              e.preventDefault()
              const normalized = normalizeRoomCode(joinRoomId)
              if (!normalized) {
                console.warn('Invalid room code format:', joinRoomId)
                return
              }
              if (await isExistingRoom(normalized))
                setStep('join-name' as RoomEntryStep)
              else {
                addToast({
                  title: 'Room not found',
                  description:
                    'Check the code or ask the host to create it first.',
                  color: 'danger',
                  variant: 'solid',
                  timeout: 4000,
                })
                console.warn('Room not found:', normalized)
              }
            }}
          >
            <Input
              isRequired
              errorMessage="Please enter a valid room code."
              placeholder="abc-def-ghi"
              size="lg"
              type="text"
              className="mb-4 w-full"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(formatRoomCodeInput(e.target.value))}
            />
            <Button
              color="primary"
              type="submit"
              disabled={isSubmitting || !joinRoomId.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <Spinner color="default" variant="simple" size="sm" />
              ) : (
                'Join'
              )}
            </Button>
          </Form>
        </div>

        {/* Create Section */}
        <div className="flex flex-col items-start p-6 w-full sm:w-1/2 rounded-lg">
          <h2 className="text-xl font-semibold mb-1">Create a room</h2>
          <p className="text-sm font-medium mb-4 text-gray-500">
            Start a new session
          </p>
          <Button
            color="default"
            onPress={() => {
              if (!userName.trim()) setUserName(generateRandomUserName())
              setStep('create-name')
            }}
            className="w-full mt-auto"
          >
            Create
          </Button>
        </div>
      </div>
    </>
  )

  const renderNameStep = (isJoining: boolean) => (
    <div className="flex flex-col items-start px-4 w-full max-w-sm">
      <form
        className="w-full"
        onSubmit={(e) => {
          e.preventDefault()
          ;(isJoining ? handleJoinRoom : handleCreateRoom)()
        }}
      >
        <h2 className="text-2xl font-semibold mb-1">What&apos;s your name?</h2>
        <p className="text-sm font-medium mb-5 text-gray-500">
          This will be your display name in the session.
        </p>
        <Input
          placeholder="Enter your name"
          size="lg"
          type="text"
          className="mb-4"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          autoFocus
        />
        <Button
          color="primary"
          type="submit"
          className="w-30"
          disabled={isSubmitting || !userName.trim()}
        >
          {isSubmitting ? (
            <Spinner color="default" variant="simple" size="sm" />
          ) : isJoining ? (
            'Enter Room'
          ) : (
            'Create Room'
          )}
        </Button>
      </form>
    </div>
  )

  return (
    <main>
      <div className="min-h-screen flex flex-col items-center py-8 px-4">
        <div className="mb-20 text-2xl">
          <Logo className="w-64 h-auto text-gray-900 dark:text-white" />
        </div>

        <div className="flex items-start justify-center w-full max-w-4xl">
          {step === 'initial' && renderInitial()}
          {step === 'join-name' && renderNameStep(true)}
          {step === 'create-name' && renderNameStep(false)}
        </div>
      </div>
    </main>
  )
}
