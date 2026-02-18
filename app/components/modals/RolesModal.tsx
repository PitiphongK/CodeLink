'use client'
import React, { useState } from 'react'

import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react'
import { Check, Copy, Crown, Info, MoreVertical } from 'lucide-react'

import type { AwarenessState } from '@/app/interfaces/awareness'

type Role = 'driver' | 'navigator'

type Props = {
  isOpen: boolean
  onClose: () => void
  isOwner: boolean
  users: Array<[number, AwarenessState]>
  getRole: (clientId: number) => Role
  onSetRole: (clientId: number, role: Role) => void
  currentOwnerId?: number | null
  onTransferOwner?: (clientId: number) => void
  onCopyLink?: () => void
}

export default function RolesModal({
  isOpen,
  onClose,
  isOwner,
  users,
  getRole,
  onSetRole,
  currentOwnerId,
  onTransferOwner,
  onCopyLink,
}: Props) {
  const canTransfer = isOwner && Boolean(onTransferOwner)
  const [pendingOwner, setPendingOwner] = useState<{
    id: number
    name: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const confirmTransfer = () => {
    if (!pendingOwner || !canTransfer || !onTransferOwner) return
    onTransferOwner(pendingOwner.id)
    setPendingOwner(null)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-lg font-semibold">
              Manage access
              <span className="text-sm font-normal text-default-500">
                Control permissions and roles for current members.
              </span>
            </ModalHeader>
            <ModalBody className="gap-4">

              <Table
                isHeaderSticky
                removeWrapper
                aria-label="Manage roles"
                selectionMode="none"
                classNames={{
                  base: "max-h-[250px] overflow-auto",
                }}
              >
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn width={200}>
                    <div className="flex items-center gap-2">
                      <span>ROLE</span>
                      <Tooltip
                        content={
                          <div className="text-xs space-y-1">
                            <div><span className="font-semibold">Driver:</span> Can edit code</div>
                            <div><span className="font-semibold">Navigator:</span> Cannot edit, follows driver</div>
                          </div>
                        }
                        delay={0}
                      >
                        <Info size={16} className="text-default-400 cursor-help" />
                      </Tooltip>
                    </div>
                  </TableColumn>
                  <TableColumn align="center">ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No participants">
                  {users.map(([clientId, state]) => {
                    const name = state.user?.name ?? `User ${clientId}`
                    const role = getRole(clientId)
                    const isCurrentOwner = clientId === currentOwnerId
                    const disableRoleChange = !isOwner

                    return (
                      <TableRow
                        key={clientId}
                        className="bg-surface-primary"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{
                                background: state.user?.color ?? '#888',
                              }}
                            />
                            <span className="text-sm font-medium">{name}</span>
                            {isCurrentOwner && (
                              <Chip size="sm" variant="flat" color="warning">
                                Owner
                              </Chip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            className="max-w-45"
                            selectedKeys={new Set([role])}
                            aria-label={`Set role for ${name}`}
                            isDisabled={disableRoleChange}
                            size="sm"
                            onSelectionChange={(keys) => {
                              const sel = Array.from(keys)[0] as Role
                              onSetRole(clientId, sel)
                            }}
                          >
                            <SelectItem key="driver">Driver</SelectItem>
                            <SelectItem key="navigator">Navigator</SelectItem>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Dropdown placement="bottom-start">
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                aria-label={`More actions for ${name}`}
                                className="text-default-500"
                              >
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label={`Ownership actions for ${name}`}
                              disabledKeys={
                                canTransfer && !isCurrentOwner
                                  ? []
                                  : ['make-owner']
                              }
                            >
                              <DropdownItem
                                key="make-owner"
                                startContent={<Crown size={16} />}
                                onPress={() => {
                                  if (!canTransfer || isCurrentOwner) return
                                  const candidate =
                                    state.user?.name ?? `User ${clientId}`
                                  setPendingOwner({
                                    id: clientId,
                                    name: candidate,
                                  })
                                }}
                              >
                                Set as owner
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ModalBody>

            <Modal
              isOpen={Boolean(pendingOwner)}
              onClose={() => setPendingOwner(null)}
              size="sm"
              backdrop="blur"
            >
              <ModalContent>
                {() => (
                  <>
                    <ModalHeader className="text-base font-semibold">
                      Make owner?
                    </ModalHeader>
                    <ModalBody>
                      <div className="text-sm text-default-700">
                        {pendingOwner
                          ? `Make ${pendingOwner.name} the owner of this room?`
                          : ''}
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        variant="flat"
                        size="sm"
                        onPress={() => setPendingOwner(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        color="primary"
                        size="sm"
                        onPress={confirmTransfer}
                      >
                        Yes, make owner
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>

            <ModalFooter className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {onCopyLink && (
                  <Tooltip content={copied ? 'Link copied' : 'Copy room link'}>
                    <Button
                      size="sm"
                      variant="flat"
                      color={copied ? 'success' : 'default'}
                      startContent={
                        copied ? <Check size={16} /> : <Copy size={16} />
                      }
                      onPress={() => {
                        onCopyLink()
                        setCopied(true)
                        window.setTimeout(() => setCopied(false), 5000)
                      }}
                    >
                      {copied ? 'Link copied!' : 'Copy room link'}
                    </Button>
                  </Tooltip>
                )}
              </div>
              <Button variant="light" color="danger" onPress={onClose} size="sm">
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
