"use client";
import { Stage, Layer, Line } from "react-konva";
import { useState, useRef, useEffect } from "react";
import * as Y from "yjs";
import { nanoid } from "nanoid";
import type { KonvaEventObject } from "konva/lib/Node";

/**
 * DrawingPath interface with path isolation for simultaneous drawings
 * 
 * Each stroke is its own object with:
 * - id: Unique identifier (prevents collisions if two users create stroke at same time)
 * - points: Array of coordinates for this stroke ONLY
 * - tool: "pen" or "eraser"
 * - timestamp: When the stroke started (used for consistent ordering)
 */
interface ILine {
  id: string;
  points: number[];
  tool: string;
  timestamp: number;
}

const DrawingBoard = ({ ydoc, tool }: { ydoc: Y.Doc | null, tool: "pen" | "eraser" }) => {
  const [lines, setLines] = useState<ILine[]>([]);
  const isDrawing = useRef(false);
  const currentLineRef = useRef<ILine | null>(null);
  const yLines = ydoc?.getArray<ILine>("drawing");

  useEffect(() => {
    if (!yLines) return;

    const observer = () => {
      // Sort by timestamp to ensure consistent order across all clients
      // This prevents visual differences caused by network latency
      const sorted = yLines.toArray().sort((a, b) => {
        return (a.timestamp || 0) - (b.timestamp || 0);
      });
      setLines(sorted);
    };

    yLines.observe(observer);

    // Set initial state
    const sorted = yLines.toArray().sort((a, b) => {
      return (a.timestamp || 0) - (b.timestamp || 0);
    });
    setLines(sorted);

    return () => {
      yLines.unobserve(observer);
    };
  }, [yLines]);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    // Create new line with unique ID and timestamp
    // This ensures this stroke is isolated and won't connect to other users' strokes
    const newLine: ILine = {
      id: nanoid(),
      points: [pos.x, pos.y],
      tool,
      timestamp: Date.now(),
    };
    
    // Store locally for mouse move updates
    currentLineRef.current = newLine;
    
    // Add to Yjs
    if (yLines) {
      yLines.push([newLine]);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point || !currentLineRef.current) return;

    // Update local current line (not Yjs yet)
    currentLineRef.current.points = currentLineRef.current.points.concat([
      point.x,
      point.y,
    ]);
    
    // Redraw locally for instant feedback
    setLines(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (lastIndex >= 0 && updated[lastIndex].id === currentLineRef.current?.id) {
        updated[lastIndex] = { ...currentLineRef.current };
      }
      return updated;
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    
    // Commit the complete stroke to Yjs
    if (currentLineRef.current && yLines) {
      // Find the path we're drawing and update it with final points
      const lastIndex = yLines.length - 1;
      if (lastIndex >= 0) {
        const lastLine = yLines.get(lastIndex);
        if (lastLine && lastLine.id === currentLineRef.current.id) {
          // Delete the old version and push the complete one
          yLines.delete(lastIndex, 1);
          yLines.push([currentLineRef.current]);
        }
      }
    }
    
    currentLineRef.current = null;
  };

  const handleLineClick = (lineId: string) => {
    if (tool === "eraser") {
      if (yLines) {
        // Find index by ID and delete
        const index = yLines.toArray().findIndex(line => line.id === lineId);
        if (index !== -1) {
          yLines.delete(index, 1);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow w-full h-full">
        <Stage
          width={window.innerWidth / 2} // Adjust as needed
          height={window.innerHeight - 100} // Adjust as needed
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          className="bg-white"
        >
          <Layer>
            {lines.map((line) => (
              <Line
                key={line.id}
                points={line.points}
                stroke="black"
                strokeWidth={line.tool === "eraser" ? 20 : 5}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === "eraser" ? "destination-out" : "source-over"
                }
                onClick={() => handleLineClick(line.id)}
                onTap={() => handleLineClick(line.id)}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DrawingBoard;
