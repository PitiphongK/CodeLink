"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

type Props = {
  isOpen: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function EndSessionConfirmModal({ isOpen, pending, onCancel, onConfirm }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={pending ? () => {} : onCancel} backdrop="blur">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">End session?</ModalHeader>
            <ModalBody>
              <div className="text-sm text-gray-500">
                This will close the room for everyone. You’ll see the session analytics next.
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onCancel} isDisabled={!!pending}>
                Cancel
              </Button>
              <Button color="danger" onPress={onConfirm} isLoading={!!pending}>
                End session
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
