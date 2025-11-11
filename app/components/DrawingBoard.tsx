"use client";
import { Stage, Layer, Line } from "react-konva";
import { useState, useRef, useEffect } from "react";
import { Pen, Eraser, Undo, Redo } from "lucide-react";
import { Button } from "@heroui/react";
import * as Y from "yjs";

interface ILine {
  points: number[];
  tool: string;
}

const DrawingBoard = ({ ydoc }: { ydoc: Y.Doc | null }) => {
  const [tool, setTool] = useState<string>('pen');

  return (
    <div className="relative h-full w-1/2">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 p-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md">
        <div className="flex space-x-2 items-center">
          <Button
            isIconOnly
            aria-label="Pen"
            color="primary"
            variant={tool === 'pen' ? 'solid' : 'ghost'}
            onPress={() => { setTool('pen') }}
          >
            <Pen size={16} />
          </Button>
          <Button
            isIconOnly
            aria-label="Eraser"
            color="primary"
            variant={tool === 'eraser' ? 'solid' : 'ghost'}
            onPress={() => { setTool('eraser') }}
          >
            <Eraser size={16} />
          </Button>
          <Button
            isIconOnly
            aria-label="Undo"
            color="default"
            onPress={() => { /* TODO: implement undo */ }}
          >
            <Undo size={16} />
          </Button>
          <Button
            isIconOnly
            aria-label="Redo"
            color="default"
            onPress={() => { /* TODO: implement redo */ }}
          >
            <Redo size={16} />
          </Button>
        </div>
      </div>
      <div className="flex-grow w-full h-full">
        <Stage
          width={window.innerWidth / 2} // Adjust as needed
          height={window.innerHeight - 100} // Adjust as needed
          // onMouseDown={handleMouseDown}
          // onMousemove={handleMouseMove}
          // onMouseup={handleMouseUp}
          className="bg-white position-fixed top-0 left-0 w-full h-full"
        >
          <Layer>

          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DrawingBoard;
