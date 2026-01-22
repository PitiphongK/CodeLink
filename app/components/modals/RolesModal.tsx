"use client";
import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { MoreVertical } from "lucide-react";
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
  onCopyLink?: () => void;
};

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
  const canTransfer = isOwner && Boolean(onTransferOwner);
  const [pendingOwner, setPendingOwner] = useState<{ id: number; name: string } | null>(null);

  const confirmTransfer = () => {
    if (!pendingOwner || !canTransfer || !onTransferOwner) return;
    onTransferOwner(pendingOwner.id);
    setPendingOwner(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-lg font-semibold">
              Manage access
              <span className="text-xs font-normal text-default-500">Assign driver / navigator roles and ownership</span>
            </ModalHeader>
            <ModalBody className="gap-4">
              {!isOwner && (
                <div className="text-xs text-warning-500">Only the owner can change roles or ownership.</div>
              )}

              <Table removeWrapper aria-label="Manage roles">
                <TableHeader>
                  <TableColumn>Name</TableColumn>
                  <TableColumn>Role</TableColumn>
                  <TableColumn align="end">Actions</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No participants">
                  {users.map(([clientId, state]) => {
                    const name = state.user?.name ?? `User ${clientId}`;
                    const role = getRole(clientId);
                    const isCurrentOwner = clientId === currentOwnerId;
                    const disableRoleChange = !isOwner;

                    return (
                      <TableRow key={clientId} className="bg-[#121212] border-b border-zinc-800">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ background: state.user?.color ?? "#888" }} />
                            <span className="text-sm font-medium">{name}</span>
                            {isCurrentOwner && (
                              <span className="text-[11px] rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-blue-200">
                                Owner
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            className="max-w-[180px]"
                            selectedKeys={new Set([role])}
                            aria-label={`Set role for ${name}`}
                            isDisabled={disableRoleChange}
                            onSelectionChange={(keys) => {
                              const sel = Array.from(keys)[0] as Role;
                              onSetRole(clientId, sel);
                            }}
                          >
                            <SelectItem key="driver">Driver</SelectItem>
                            <SelectItem key="navigator">Navigator</SelectItem>
                            <SelectItem key="none">None</SelectItem>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
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
                                canTransfer && !isCurrentOwner ? [] : ["make-owner"]
                              }
                            >
                              <DropdownItem
                                key="make-owner"
                                onPress={() => {
                                  if (!canTransfer || isCurrentOwner) return;
                                  const candidate = state.user?.name ?? `User ${clientId}`;
                                  setPendingOwner({ id: clientId, name: candidate });
                                }}
                              >
                                Set as owner
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    );
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
                    <ModalHeader className="text-base font-semibold">Make owner?</ModalHeader>
                    <ModalBody>
                      <div className="text-sm text-default-700">
                        {pendingOwner ? `Make ${pendingOwner.name} the owner of this room?` : ""}
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button variant="flat" size="sm" onPress={() => setPendingOwner(null)}>
                        Cancel
                      </Button>
                      <Button color="primary" size="sm" onPress={confirmTransfer}>
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
                  <Button variant="bordered" onPress={onCopyLink} size="sm" className="bg-[#f5f5f5] text-black">
                    Copy link
                  </Button>
                )}
              </div>
              <Button variant="flat" onPress={onClose} size="sm">
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
