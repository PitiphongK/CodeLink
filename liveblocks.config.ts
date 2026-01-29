// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: Record<string, unknown>

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: Record<string, unknown>

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string
      info: Record<string, unknown>
    }

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: Record<string, unknown>
    // Example has two events, using a union
    // | { type: "PLAY" }
    // | { type: "REACTION"; emoji: "🔥" };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, unknown>

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, unknown>
  }
}

export {}
