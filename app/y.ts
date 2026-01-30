/*
The main shared yjs data structures for the app (the doc, lines, and services).
*/
import { WebsocketProvider } from 'y-websocket'
import { Stroke } from './interfaces/drawing'
import * as Y from 'yjs'

// This collects all existing room
const yjsInstances = new Map<
  string,
  {
    doc: Y.Doc
    provider: WebsocketProvider
    awareness: WebsocketProvider['awareness']
    yStrokes: Y.Array<Stroke>
    undoManager: Y.UndoManager
    destroy: () => void
  }
>()

export function setupYjs(roomName: string) {
  let instance = yjsInstances.get(roomName)

  if (!instance) {
    const doc = new Y.Doc()
    const provider = new WebsocketProvider(
      process.env.WEBSOCKET_URL || 'wss://demos.yjs.dev', // TODO: set env
      roomName,
      doc
    )

    const awareness = provider.awareness
    const yStrokes = doc.getArray<Stroke>('strokes')
    const undoManager = new Y.UndoManager(yStrokes)

    // A function to clean up when the instance is no longer needed
    const destroy = () => {
      doc.destroy()
      provider.destroy()
      yjsInstances.delete(roomName)
      console.log(`Destroyed Yjs instance for room: ${roomName}`)
    }

    instance = {
      doc,
      provider,
      awareness,
      yStrokes,
      undoManager,
      destroy,
    }

    yjsInstances.set(roomName, instance)
  }

  return instance
}