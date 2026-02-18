'use client'

import React from 'react'

import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'

type Role = 'driver' | 'navigator'

type Props = {
  isOpen: boolean
  role: Role
  dontShowAgain: boolean
  onChangeDontShowAgain: (value: boolean) => void
  onOk: () => void
}

function getCopy(role: Role) {
  if (role === 'driver') {
    return {
      title: 'You are the Driver',
      body: (
        <div className="space-y-2 text-sm text-gray-500">
          <div>You can edit the code.</div>
          <div>
            The Navigator (other users) cannot edit and will automatically follow you.
          </div>
        </div>
      ),
    }
  }

  return {
    title: 'You are the Navigator',
    body: (
      <div className="space-y-2 text-sm text-gray-500">
        <div>You are in read-only mode (no editing).</div>
        <div>
          You will automatically follow the Driver. 
        </div>
      </div>
    ),
  }
}

export default function RoleNoticeModal({
  isOpen,
  role,
  dontShowAgain,
  onChangeDontShowAgain,
  onOk,
}: Props) {
  const copy = getCopy(role)

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      backdrop="blur"
      isDismissable={false}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {copy.title}
            </ModalHeader>
            <ModalBody>
              {copy.body}
              <Checkbox
                isSelected={dontShowAgain}
                onValueChange={onChangeDontShowAgain}
                className="mt-2"
              >
                Don't show this again
              </Checkbox>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onOk}>
                OK
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
