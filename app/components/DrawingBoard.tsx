"use client";
import { Stage, Layer, Line } from "react-konva";
import { useState, useRef, useEffect } from "react";
import * as Y from "yjs";
import type { KonvaEventObject } from "konva/lib/Node";

interface ILine {
  points: number[];
  tool: string;
}

const DrawingBoard = ({ ydoc, tool }: { ydoc: Y.Doc | null, tool: "pen" | "eraser" }) => {
  const [lines, setLines] = useState<ILine[]>([]);
  const isDrawing = useRef(false);
  const yLines = ydoc?.getArray<ILine>("drawing");

  useEffect(() => {
    if (!yLines) return;

    const observer = () => {
      setLines(yLines.toArray());
    };

    yLines.observe(observer);

    // Set initial state
    setLines(yLines.toArray());

    return () => {
      yLines.unobserve(observer);
    };
  }, [yLines]);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    if (yLines) {
      yLines.push([{ points: [pos.x, pos.y], tool }]);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    if (yLines) {
      const lastLine = yLines.get(yLines.length - 1);
      if (lastLine) {
        // add point
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        const newLines = yLines.toArray();
        newLines.splice(yLines.length - 1, 1, lastLine);
        // Manually trigger update for remote clients
        // This is a bit of a hack, but Yjs array updates on nested objects are tricky
        yLines.delete(yLines.length - 1);
        yLines.push([lastLine]);
      }
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleLineClick = (index: number) => {
    if (tool === "eraser") {
      if (yLines) {
        yLines.delete(index, 1);
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
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke="black"
                strokeWidth={line.tool === "eraser" ? 20 : 5}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === "eraser" ? "destination-out" : "source-over"
                }
                onClick={() => handleLineClick(i)}
                onTap={() => handleLineClick(i)}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DrawingBoard;
