'use client'

import React, { useMemo } from 'react'

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'

type Summary = {
  sessionMs: number
  driverMs: number
  navigatorMs: number
  noneMs: number
}

type UserRoleContribution = {
  clientId: number
  name: string
  driverMs: number
  navigatorMs: number
  noneMs: number
}

type Props = {
  isOpen: boolean
  onClose: () => void
  summary: Summary | null
  users?: UserRoleContribution[] | null
  primaryActionLabel?: string
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function RolePie({
  driverMs,
  navigatorMs,
  noneMs,
  size = 44,
  stroke = 8,
}: {
  driverMs: number
  navigatorMs: number
  noneMs: number
  size?: number
  stroke?: number
}) {
  const total =
    Math.max(0, driverMs) + Math.max(0, navigatorMs) + Math.max(0, noneMs)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  const segments = [
    {
      key: 'driver',
      value: Math.max(0, driverMs),
      className: 'stroke-blue-500',
    },
    {
      key: 'navigator',
      value: Math.max(0, navigatorMs),
      className: 'stroke-orange-500',
    },
    { key: 'none', value: Math.max(0, noneMs), className: 'stroke-gray-500' },
  ] as const

  let offset = 0

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="transparent"
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth={stroke}
        />
        {total > 0
          ? segments.map((s) => {
              const dash = (s.value / total) * c
              const el = (
                <circle
                  key={s.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="transparent"
                  className={s.className}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${c}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              )
              offset += dash
              return el
            })
          : null}
      </g>
    </svg>
  )
}

export default function SessionSummaryModal({
  isOpen,
  onClose,
  summary,
  users,
  primaryActionLabel,
}: Props) {
  const rows = useMemo(() => {
    if (!summary) return []
    return [
      { label: 'Driver', value: summary.driverMs },
      { label: 'Navigator', value: summary.navigatorMs },
      { label: 'None', value: summary.noneMs },
    ]
  }, [summary])

  return (
    <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Session summary
            </ModalHeader>
            <ModalBody>
              {!summary ? (
                <div className="text-sm text-gray-500">No data available.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Session duration
                    </span>
                    <span className="text-sm font-medium">
                      {formatDuration(summary.sessionMs)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-700" />
                  <div className="text-sm font-medium">Your active time</div>
                  <div className="flex flex-col gap-2">
                    {rows.map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-500">{r.label}</span>
                        <span className="text-sm font-medium">
                          {formatDuration(r.value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {users && users.length > 0 ? (
                    <>
                      <div className="h-px bg-gray-200 dark:bg-gray-700" />
                      <div className="text-sm font-medium">
                        Role contribution
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                          Driver
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
                          Navigator
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-gray-500" />
                          None
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        {users.map((u) => (
                          <div
                            key={u.clientId}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {u.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDuration(u.driverMs)} driver •{' '}
                                {formatDuration(u.navigatorMs)} nav •{' '}
                                {formatDuration(u.noneMs)} none
                              </div>
                            </div>
                            <RolePie
                              driverMs={u.driverMs}
                              navigatorMs={u.navigatorMs}
                              noneMs={u.noneMs}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onClose}>
                {primaryActionLabel ?? 'Back to home'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
