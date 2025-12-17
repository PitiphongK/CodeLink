"use client";
import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem } from "@heroui/react";
import type { AwarenessState } from "@/app/interfaces/awareness";

type Role = "driver" | "navigator" | "none";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  users: Array<[number, AwarenessState]>;
  getRole: (clientId: number) => Role;
  onSetRole: (clientId: number, role: Role) => void;
  currentOwnerId?: number | null;
  onTransferOwner?: (clientId: number) => void;
};

  export default function RolesModal({ isOpen, onClose, isOwner, users, getRole, onSetRole, currentOwnerId, onTransferOwner }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">Driver / Navigator Roles</ModalHeader>
            <ModalBody>
              {!isOwner && (
                <div className="text-xs text-warning-500 mb-2">Only the host can assign roles.</div>
              )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm">Owner:</span>
                  <span className="text-sm font-medium">
                    {(() => {
                      const entry = users.find(([cid]) => cid === currentOwnerId);
                      return entry ? (entry[1]?.user?.name ?? `User ${entry[0]}`) : 'Unknown';
                    })()}
                  </span>
                </div>
                {isOwner && onTransferOwner && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm">Transfer ownership to:</span>
                    <Select
                      className="max-w-[220px]"
                      aria-label="Transfer ownership"
                      selectedKeys={currentOwnerId != null ? new Set([String(currentOwnerId)]) : new Set()}
                      onSelectionChange={(keys) => {
                        const sel = Array.from(keys)[0];
                        const targetId = sel ? Number(sel) : NaN;
                        if (!isNaN(targetId)) {
                          onTransferOwner(targetId);
                        }
                      }}
                    >
                      {users.map(([cid, state]) => (
                        <SelectItem key={String(cid)}>{state.user?.name ?? `User ${cid}`}</SelectItem>
                      ))}
                    </Select>
                  </div>
                )}
              <div className="flex flex-col gap-3">
                {users.map(([clientId, state]) => {
                  const name = state.user?.name ?? `User ${clientId}`;
                  const role = getRole(clientId);
                  return (
                    <div key={clientId} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: state.user?.color ?? "#888" }} />
                        <span className="text-sm">{name}</span>
                      </div>
                      <Select
                        className="max-w-[160px]"
                        selectedKeys={new Set([role])}
                        aria-label={`Set role for ${name}`}
                        isDisabled={!isOwner}
                        onSelectionChange={(keys) => {
                          const sel = Array.from(keys)[0] as Role;
                          onSetRole(clientId, sel);
                        }}
                      >
                        <SelectItem key="none">None</SelectItem>
                        <SelectItem key="driver">Driver</SelectItem>
                        <SelectItem key="navigator">Navigator</SelectItem>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>Close</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
