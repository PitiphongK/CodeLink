"use client";

import { Button, Input, Spinner, Form } from "@heroui/react";
import { ThemeSwitcher } from "./theme-switcher";
import { useRoomLanding } from "@/app/hooks/useRoomLanding";
import type { RoomEntryStep } from "@/app/interfaces/types";
import { normalizeRoomCode } from "@/app/utils/roomCode";

export default function HomeClient() {
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
  } = useRoomLanding();

  const renderInitial = () => (
    <>
      <div className="flex flex-col items-start p-8 w-full md:w-1/2">
        <h2 className="text-2xl font-semibold mb-1">Join a room</h2>
        <p className="text-sm font-medium mb-5 text-gray-500">
          Join an existing pair programming session.
        </p>

        <Form
          className="w-full"
          onSubmit={async (e) => {
            e.preventDefault();
            const normalized = normalizeRoomCode(joinRoomId);
            if (!normalized) {
              console.warn("Invalid room code format:", joinRoomId);
              return;
            }
            if (await isExistingRoom(normalized)) setStep("join-name" as RoomEntryStep);
            else {
              alert("Room not found.");
              console.warn("Room not found:", normalized);
            }
          }}
        >
          <Input
            isRequired
            errorMessage="Please enter a valid room code."
            placeholder="abe-123-xyz"
            size="lg"
            type="text"
            className="mb-4 w-full"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
          />
          <Button color="primary" type="submit" disabled={isSubmitting || !joinRoomId.trim()}>
            {isSubmitting ? <Spinner color="default" variant="simple" size="sm" /> : "Join"}
          </Button>
        </Form>
      </div>

      <div className="hidden md:block w-px bg-gray-300 dark:bg-gray-700 h-64 mx-8"></div>

      <div className="flex flex-col items-start p-8 w-full md:w-1/2">
        <h2 className="text-2xl font-semibold mb-1">Create a room</h2>
        <p className="text-sm font-medium mb-5 text-gray-500">
          Start a new pair programming session.
        </p>
        <Button color="primary" onPress={() => setStep("create-name")}>
          Create
        </Button>
      </div>
    </>
  );

  const renderNameStep = (isJoining: boolean) => (
    <div className="flex flex-col items-start px-4 w-full max-w-sm">
      <form
        className="w-full"
        onSubmit={(e) => {
          e.preventDefault();
          (isJoining ? handleJoinRoom : handleCreateRoom)();
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
            "Enter Room"
          ) : (
            "Create Room"
          )}
        </Button>
      </form>
    </div>
  );

  return (
    <main>
      <div className="min-h-screen flex flex-col items-center py-8 px-4">
        <div className="mb-20 text-2xl">CodeLink</div>

        <div className="flex items-start justify-center w-full max-w-4xl">
          {step === "initial" && renderInitial()}
          {step === "join-name" && renderNameStep(true)}
          {step === "create-name" && renderNameStep(false)}
        </div>
      </div>

      <ThemeSwitcher />
    </main>
  );
}
