'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Layer, Line, Stage } from 'react-konva'

import type { KonvaEventObject } from 'konva/lib/Node'
import * as Y from 'yjs'

type OverlayLine = {
  points: number[]
  tool: 'pen'
  color?: string
}

/**
 * Overlay drawing component that can be toggled on top of the IDE/editor area.
 * - Toggle button shows in the top-right of the component.
 * - When enabled the overlay captures pointer events and you can draw.
 * - Pen color defaults to white so it's visible over dark editor themes.
 */
export default function EditorOverlayDrawing({
  ydoc,
  active,
  tool,
}: {
  ydoc?: Y.Doc | null
  active: boolean
  tool: 'pen' | 'eraser'
}) {
  const [lines, setLines] = useState<OverlayLine[]>([])
  const isDrawing = useRef(false)
  const currentIdx = useRef<number | null>(null)
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 800, h: 600 })

  // Use a separate Yjs array for the editor overlay so it doesn't sync with the sidebar DrawingBoard
  const yLines = ydoc?.getArray<OverlayLine>('overlayDrawing')

  useEffect(() => {
    if (!yLines) return
    const observer = () => setLines(yLines.toArray())
    yLines.observe(observer)
    setLines(yLines.toArray())
    return () => yLines.unobserve(observer)
  }, [yLines])

  useEffect(() => {
    function update() {
      setSize({ w: window.innerWidth, h: window.innerHeight })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const start = (pos: { x: number; y: number }) => {
    if (tool !== 'pen') return
    isDrawing.current = true
    if (!yLines) return
    // push a new plain object into the Yjs array
    yLines.push([{ points: [pos.x, pos.y], tool: 'pen' }])
    currentIdx.current = yLines.length - 1
  }

  const addPoint = (pos: { x: number; y: number }) => {
    if (!isDrawing.current) return
    if (!yLines) return

    const lastIdx = yLines.length - 1
    const lastLine = yLines.get(lastIdx)
    if (lastLine) {
      // append point to the last line's points array and replace it to trigger updates
      lastLine.points = lastLine.points.concat([pos.x, pos.y])
      // replace last element (hacky way to notify observers about nested change)
      yLines.delete(lastIdx, 1)
      yLines.push([lastLine])
    }
  }

  const end = () => {
    isDrawing.current = false
    currentIdx.current = null
  }

  // Konva pointer handlers
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (!active) return
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return
    if (tool === 'pen') {
      start(pos)
    }
    // for eraser, we'll rely on the per-line onClick handler to delete the Yjs entry by index
  }

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!active) return
    if (!isDrawing.current) return
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return
    addPoint(pos)
  }

  const handleMouseUp = () => {
    if (!active) return
    end()
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Drawing stage. When inactive we set pointer-events none so editor remains usable. */}
      <div
        className={`absolute inset-0 z-30 ${active ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <Stage
          width={size.w}
          height={size.h}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ background: 'transparent' }}
        >
          <Layer>
            {lines.map((l, i) => (
              <Line
                key={i}
                id={String(i)}
                points={l.points}
                stroke={l.color || 'white'}
                strokeWidth={6}
                tension={0.4}
                lineCap="round"
                lineJoin="round"
                onClick={() => {
                  if (tool === 'eraser' && yLines) {
                    yLines.delete(i, 1)
                  }
                }}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
