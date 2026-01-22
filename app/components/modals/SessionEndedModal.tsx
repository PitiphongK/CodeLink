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
  onGoHome: () => void;
};

export default function SessionEndedModal({ isOpen, onGoHome }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      backdrop="blur"
      isDismissable={false}
      hideCloseButton
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">Session ended</ModalHeader>
            <ModalBody>
              <div className="text-sm text-gray-500">
                The owner has ended the session. This room is now closed.
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onGoHome}>
                Back to home
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
