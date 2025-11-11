import * as Y from 'yjs';
import { doc, provider, yLines, awareness, undoManager } from '@/app/lib/y';
import { User } from '@/app/interfaces/user';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useLines() {
  // Track connection status
  const [isConnected, setIsConnected] = useState<boolean>(false);
  // lines will be rendered on Konva
  const [lines, setLines] = useState<Y.Map<any>[]>([]); // might need to use Y.Map<any>[] ### fixme: remove any
  // Track current line being drawn
  const rCurrentLine = useRef<Y.Map<any> | null>(null);

  // On mount, setup Yjs connection and observers
  useEffect(() => {
    function handleConnection() {
      setIsConnected(true);
      const lines = yLines.toArray();
      setLines(lines);
    }

    provider.on('sync', handleConnection);
    provider.connect();

    return () => {
      provider.disconnect();
    };

  }, []);

  // Observe changes to yLines and update local state
  useEffect(() => {
    function handleChange() {
      const lines = yLines.toArray();
      setLines(lines);
    }

    // when lines change in Yjs, call handleChange
    yLines.observe(handleChange);

    return () => {
      yLines.unobserve(handleChange); // cleanup when component unmounts
    };
  }, []);

  const startLine = useCallback((point: number[]) => {
    const yLine = new Y.Map<any>();
    const yPoints = new Y.Array<number>();
    yPoints.push([...point]); // pass copy of point just in case

    // Group updates in transact for undo/redo/delete
    doc.transact(() => {
      yLine.set('id', crypto.randomUUID());
      yLine.set('points', yPoints);
      yLine.set("color", "black"); // default color
      rCurrentLine.current = yLine;
    });

    rCurrentLine.current = yLine;
    yLines.push([yLine]);
  }, []);
}