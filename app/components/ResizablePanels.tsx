'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

type ResizablePanelsProps = {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  leftTitle: string;
  rightTitle: string;
  defaultLeftWidth?: number; // percentage
};

export default function ResizablePanels({
  leftPanel,
  rightPanel,
  leftTitle,
  rightTitle,
  defaultLeftWidth = 60,
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [rightExpanded, setRightExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

      // Constrain between 20% and 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Calculate effective widths based on expansion state
  const getEffectiveWidths = () => {
    if (leftExpanded) return { left: 95, right: 5 };
    if (rightExpanded) return { left: 5, right: 95 };
    return { left: leftWidth, right: 100 - leftWidth };
  };

  const { left, right } = getEffectiveWidths();

  return (
    <div ref={containerRef} className="flex h-full w-full relative">
      {/* Left Panel */}
      <div
        className="relative transition-all duration-300 ease-in-out"
        style={{ width: `${left}%` }}
      >
        {/* Left Tab */}
        {/* <div
          className={`absolute top-4 left-0 z-10 bg-blue-600 text-white px-3 py-1 rounded-r-md cursor-pointer transition-all duration-200 ${
            leftExpanded ? 'translate-x-0' : '-translate-x-0'
          }`}
          onMouseEnter={() => !rightExpanded && setLeftExpanded(true)}
          onMouseLeave={() => setLeftExpanded(false)}
        >
          {leftTitle}
        </div> */}
        <div className="h-full overflow-hidden">
          {leftPanel}
        </div>
      </div>

      {/* Draggable Divider */}
      <div
        className={`w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors relative ${
          isDragging ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleDividerMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      {/* Right Panel */}
      <div
        className="relative transition-all duration-300 ease-in-out"
        style={{ width: `${right}%` }}
      >
        {/* Right Tab */}
        {/* <div
          className={`absolute top-4 right-0 z-10 bg-green-600 text-white px-3 py-1 rounded-l-md cursor-pointer transition-all duration-200 ${
            rightExpanded ? 'translate-x-0' : 'translate-x-0'
          }`}
          onMouseEnter={() => !leftExpanded && setRightExpanded(true)}
          onMouseLeave={() => setRightExpanded(false)}
        >
          {rightTitle}
        </div> */}
        <div className="h-full overflow-hidden">
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
