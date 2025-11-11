import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export const doc = new Y.Doc();

// Create a WebSocket provider to sync the Yjs document
export const provider = new WebsocketProvider(
  "wss://demos.yjs.dev/ws",
  "demo-room",
  doc,
);

// presence
export const awareness = provider.awareness;
// shared data structures
export const yLines: Y.Array<Y.Map<any>> = doc.getArray("lines");
export const undoManager = new Y.UndoManager(yLines);
