import React from 'react';

type Props = {
  x: number;
  y: number;
  color: string;
  name: string;
};

const LiveCursor = ({ x, y, color, name }: Props) => {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: 'transform 0.1s ease-out',
        left: 0,
        top: 0,
        zIndex: 9999,
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={color}
        style={{ filter: `drop-shadow(2px 2px 4px rgba(0,0,0,0.4))` }}
      >
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      </svg>
      <div
        className="absolute ml-2 px-2 py-1 text-sm text-white rounded"
        style={{ backgroundColor: color, top: '20px' }}
      >
        {name}
      </div>
    </div>
  );
};

export default LiveCursor;
