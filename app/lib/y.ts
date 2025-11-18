/*
The main shared yjs data structures for the app (the doc, lines, and services).
*/

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const VERSION = 9;

// Create the doc
export const doc = new Y.Doc();

// Create a websocket provider (but don't connect just yet)
export const provider = new WebsocketProvider(
  "wss://demos.yjs.dev",
  `draw-demo-${VERSION}`,
  doc,
  {
    connect: false
  }
);

// Export the provider's awareness API
export const awareness = provider.awareness;

// Get a shared array of our line maps
export const yLines: Y.Array<Y.Map<any>> = doc.getArray(`lines-${VERSION}`);

// Create an undo manager for the line maps
export const undoManager = new Y.UndoManager(yLines);
