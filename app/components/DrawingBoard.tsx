"use client";
import { Stage, Layer, Line } from "react-konva";
import { useState, useRef, useEffect } from "react";
import { Pen, Eraser } from "lucide-react";
import * as Y from "yjs";

interface ILine {
  points: number[];
  tool: string;
}

const DrawingBoard = ({ ydoc }: { ydoc: Y.Doc | null }) => {
  const [tool, setTool] = useState("pen");
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

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    if (yLines) {
      yLines.push([{ points: [pos.x, pos.y], tool }]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

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
      <div className="p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded ${
              tool === "pen" ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Pen size={20} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded ${
              tool === "eraser" ? "bg-blue-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Eraser size={20} />
          </button>
        </div>
      </div>
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
