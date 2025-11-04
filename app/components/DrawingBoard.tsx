'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';

type DrawingBoardProps = {
  roomId: string;
};

type DrawingTool = 'pen' | 'eraser';

export default function DrawingBoard({ roomId }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700 bg-gray-900">
        <h2 className="text-lg font-semibold mb-3">Drawing Board</h2>
        
        <div className="flex gap-4 items-center mb-3">
          <Button
            size="sm"
            color={tool === 'pen' ? 'primary' : 'default'}
            onPress={() => setTool('pen')}
          >
            Pen
          </Button>
          <Button
            size="sm"
            color={tool === 'eraser' ? 'primary' : 'default'}
            onPress={() => setTool('eraser')}
          >
            Eraser
          </Button>
          <Button
            size="sm"
            color="danger"
            onPress={clearCanvas}
          >
            Clear
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm">Colors:</span>
          {colors.map((c) => (
            <button
              key={c}
              className="w-6 h-6 rounded-full border-2 border-white"
              style={{
                backgroundColor: c,
                borderColor: color === c ? '#fff' : '#555',
                transform: color === c ? 'scale(1.2)' : 'scale(1)',
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="flex gap-2 items-center mt-3">
          <span className="text-sm">Size:</span>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm">{lineWidth}px</span>
        </div>
      </div>

      <div className="flex-1 bg-white relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
}
